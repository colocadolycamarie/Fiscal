import { Router, type IRouter } from "express";
import { db, alertFiringsTable, dataSourcesTable, reportsTable, workspacesTable, workspaceMembersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth";
import { requireWorkspaceAccess } from "../middlewares/require-workspace-access";
import { computeHeadlineMetrics, computeRevenueTrend } from "../services/metrics";

const router: IRouter = Router();

router.use(requireAuth);

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: "alert" | "sync" | "report";
  occurredAt: Date;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/** Builds the recent-activity feed by merging real alert firings, data-source syncs, and report generations. */
async function buildActivityFeed(workspaceId: string): Promise<ActivityItem[]> {
  const [firings, sources, reports] = await Promise.all([
    db.select().from(alertFiringsTable).where(eq(alertFiringsTable.workspaceId, workspaceId)).orderBy(desc(alertFiringsTable.firedAt)).limit(5),
    db.select().from(dataSourcesTable).where(eq(dataSourcesTable.workspaceId, workspaceId)).orderBy(desc(dataSourcesTable.lastSyncAt)).limit(5),
    db.select().from(reportsTable).where(eq(reportsTable.workspaceId, workspaceId)).orderBy(desc(reportsTable.lastGeneratedAt)).limit(5),
  ]);

  const items: ActivityItem[] = [
    ...firings.map((firing) => ({
      id: firing.id,
      title: `${firing.severity === "high" ? "Alert" : "Notice"}: ${firing.narrative.split(".")[0]}.`,
      detail: firing.narrative,
      occurredAt: firing.firedAt,
      timestamp: relativeTime(firing.firedAt),
      type: "alert" as const,
    })),
    ...sources
      .filter((source) => source.lastSyncAt)
      .map((source) => ({
        id: source.id,
        title: `${source.label} synced successfully`,
        detail: `${source.rowCount.toLocaleString()} rows processed.`,
        occurredAt: source.lastSyncAt!,
        timestamp: relativeTime(source.lastSyncAt!),
        type: "sync" as const,
      })),
    ...reports
      .filter((report) => report.lastGeneratedAt)
      .map((report) => ({
        id: report.id,
        title: `${report.name} generated`,
        detail: `${report.name} is ready to share.`,
        occurredAt: report.lastGeneratedAt!,
        timestamp: relativeTime(report.lastGeneratedAt!),
        type: "report" as const,
      })),
  ];

  return items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 6);
}

router.get("/workspaces", async (req, res) => {
  const memberships = await db
    .select({ workspace: workspacesTable, role: workspaceMembersTable.role })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(eq(workspaceMembersTable.userId, req.user!.id));

  res.json(memberships.map((m) => ({ ...m.workspace, role: m.role })));
});

router.get("/workspaces/:workspaceId/summary", requireWorkspaceAccess, async (req, res) => {
  const workspaceId = req.workspaceId!;
  const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);

  if (!workspace) {
    res.status(404).json({ error: "Workspace not found." });
    return;
  }

  const [metrics, trend, activity] = await Promise.all([
    computeHeadlineMetrics(workspaceId),
    computeRevenueTrend(workspaceId),
    buildActivityFeed(workspaceId),
  ]);

  const now = new Date();
  const periodLabel = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });

  res.json({
    workspace: { id: workspace.id, name: workspace.name, baseCurrency: workspace.baseCurrency, periodLabel: `Month to date · ${periodLabel}` },
    metrics,
    trend,
    activity: activity.map((item) => ({ id: item.id, title: item.title, detail: item.detail, timestamp: item.timestamp, type: item.type })),
  });
});

router.get("/workspaces/:workspaceId/settings", requireWorkspaceAccess, async (req, res) => {
  const workspaceId = req.workspaceId!;
  const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found." });
    return;
  }
  const members = await db.select().from(workspaceMembersTable).where(eq(workspaceMembersTable.workspaceId, workspaceId));

  res.json({
    workspaceName: workspace.name,
    baseCurrency: workspace.baseCurrency,
    memberCount: members.length,
    dataPolicy: "Private workspace — data is only visible to invited members.",
    retentionDays: 365,
  });
});

export default router;
