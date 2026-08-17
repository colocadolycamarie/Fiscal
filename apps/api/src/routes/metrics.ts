import { Router, type IRouter } from "express";
import { db, metricDefinitionsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth";
import { requireWorkspaceAccess } from "../middlewares/require-workspace-access";
import { computeHeadlineMetrics } from "../services/metrics";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/metrics", requireWorkspaceAccess, async (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;

  const definitions = await db
    .select()
    .from(metricDefinitionsTable)
    .where(
      category
        ? and(eq(metricDefinitionsTable.workspaceId, req.workspaceId!), eq(metricDefinitionsTable.category, category))
        : eq(metricDefinitionsTable.workspaceId, req.workspaceId!),
    );

  const live = await computeHeadlineMetrics(req.workspaceId!);
  const liveByKey = new Map(live.map((metric) => [metric.key, metric]));

  res.json(
    definitions.map((definition) => ({
      ...definition,
      currentValue: liveByKey.get(definition.key)?.displayValue ?? null,
    })),
  );
});

router.get("/metrics/:metricKey", requireWorkspaceAccess, async (req, res) => {
  const [definition] = await db
    .select()
    .from(metricDefinitionsTable)
    .where(and(eq(metricDefinitionsTable.workspaceId, req.workspaceId!), eq(metricDefinitionsTable.key, String(req.params.metricKey))))
    .limit(1);

  if (!definition) {
    res.status(404).json({ error: "Metric not found." });
    return;
  }

  const live = await computeHeadlineMetrics(req.workspaceId!);
  const liveValue = live.find((metric) => metric.key === definition.key);

  res.json({ ...definition, currentValue: liveValue?.displayValue ?? null, sparkline: liveValue?.sparkline ?? [] });
});

export default router;
