import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, alertConditions, alertFiringsTable, alertRulesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth";
import { requireWorkspaceAccess } from "../middlewares/require-workspace-access";
import { evaluateAlertRules } from "../services/alerts";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/alerts/rules", requireWorkspaceAccess, async (req, res) => {
  const rules = await db
    .select()
    .from(alertRulesTable)
    .where(eq(alertRulesTable.workspaceId, req.workspaceId!))
    .orderBy(desc(alertRulesTable.createdAt));
  res.json(rules);
});

const createRuleSchema = z.object({
  workspaceId: z.string().uuid(),
  metricKey: z.enum(["revenue", "gross_margin", "burn_rate", "runway"]),
  condition: z.enum(alertConditions),
  thresholdValue: z.number(),
  channel: z.string().trim().min(1).max(60).optional(),
});

router.post("/alerts/rules", requireWorkspaceAccess, async (req, res) => {
  const parsed = createRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  const [rule] = await db
    .insert(alertRulesTable)
    .values({
      workspaceId: req.workspaceId!,
      metricKey: parsed.data.metricKey,
      condition: parsed.data.condition,
      thresholdValue: parsed.data.thresholdValue.toString(),
      channel: parsed.data.channel ?? "In-app",
    })
    .returning();
  res.status(201).json(rule);
});

router.patch("/alerts/rules/:ruleId", requireWorkspaceAccess, async (req, res) => {
  const parsed = z.object({ active: z.boolean() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "active must be a boolean." });
    return;
  }
  const [updated] = await db
    .update(alertRulesTable)
    .set({ active: parsed.data.active })
    .where(and(eq(alertRulesTable.id, String(req.params.ruleId)), eq(alertRulesTable.workspaceId, req.workspaceId!)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Alert rule not found." });
    return;
  }
  res.json(updated);
});

/** Re-runs every active rule against current metrics on demand. */
router.post("/alerts/evaluate", requireWorkspaceAccess, async (req, res) => {
  const firingCount = await evaluateAlertRules(req.workspaceId!);
  res.json({ firingCount });
});

router.get("/alerts/feed", requireWorkspaceAccess, async (req, res) => {
  const firings = await db
    .select({
      id: alertFiringsTable.id,
      narrative: alertFiringsTable.narrative,
      value: alertFiringsTable.value,
      severity: alertFiringsTable.severity,
      firedAt: alertFiringsTable.firedAt,
      metricKey: alertRulesTable.metricKey,
    })
    .from(alertFiringsTable)
    .innerJoin(alertRulesTable, eq(alertFiringsTable.ruleId, alertRulesTable.id))
    .where(eq(alertFiringsTable.workspaceId, req.workspaceId!))
    .orderBy(desc(alertFiringsTable.firedAt))
    .limit(20);

  res.json(firings);
});

export default router;
