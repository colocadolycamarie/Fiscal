import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, reportsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth";
import { requireWorkspaceAccess } from "../middlewares/require-workspace-access";
import { computeHeadlineMetrics, computeRevenueTrend } from "../services/metrics";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/reports", requireWorkspaceAccess, async (req, res) => {
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.workspaceId, req.workspaceId!))
    .orderBy(desc(reportsTable.createdAt));
  res.json(reports);
});

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(150),
  type: z.string().trim().min(1).max(80),
  schedule: z.string().trim().max(80).optional(),
});

router.post("/reports", requireWorkspaceAccess, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  const [report] = await db
    .insert(reportsTable)
    .values({
      workspaceId: req.workspaceId!,
      name: parsed.data.name,
      type: parsed.data.type,
      schedule: parsed.data.schedule ?? "Manual",
      status: "draft",
    })
    .returning();
  res.status(201).json(report);
});

/** Captures a real point-in-time snapshot of the workspace's metrics into the report. */
router.post("/reports/:reportId/generate", requireWorkspaceAccess, async (req, res) => {
  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.id, String(req.params.reportId)), eq(reportsTable.workspaceId, req.workspaceId!)))
    .limit(1);

  if (!report) {
    res.status(404).json({ error: "Report not found." });
    return;
  }

  const [metrics, trend] = await Promise.all([computeHeadlineMetrics(req.workspaceId!), computeRevenueTrend(req.workspaceId!)]);

  const [updated] = await db
    .update(reportsTable)
    .set({
      status: "ready",
      lastGeneratedAt: new Date(),
      snapshot: { metrics, trend, generatedAt: new Date().toISOString() },
    })
    .where(eq(reportsTable.id, report.id))
    .returning();

  res.json(updated);
});

export default router;
