import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, dataSourcesTable, workspaceMembersTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth";
import { requireWorkspaceAccess } from "../middlewares/require-workspace-access";
import { LedgerImportError, importLedgerRows, parseLedgerCsv } from "../services/ledger-import";
import { evaluateAlertRules } from "../services/alerts";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/data-sources", requireWorkspaceAccess, async (req, res) => {
  const sources = await db
    .select()
    .from(dataSourcesTable)
    .where(eq(dataSourcesTable.workspaceId, req.workspaceId!))
    .orderBy(desc(dataSourcesTable.createdAt));
  res.json(sources);
});

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  provider: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
});

router.post("/data-sources", requireWorkspaceAccess, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  const [source] = await db
    .insert(dataSourcesTable)
    .values({ workspaceId: req.workspaceId!, provider: parsed.data.provider, label: parsed.data.label, status: "connecting" })
    .returning();
  res.status(201).json(source);
});

const importSchema = z.object({
  csv: z.string().min(1, "The file is empty."),
});

/**
 * Imports a CSV ledger export into this data source's transactions, then
 * re-evaluates alert rules against the freshly updated numbers.
 */
router.post("/data-sources/:dataSourceId/import", async (req, res) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const [source] = await db.select().from(dataSourcesTable).where(eq(dataSourcesTable.id, String(req.params.dataSourceId))).limit(1);
  if (!source) {
    res.status(404).json({ error: "Data source not found." });
    return;
  }

  // Verify the caller belongs to the workspace this data source lives in.
  const [membership] = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, source.workspaceId), eq(workspaceMembersTable.userId, req.user!.id)))
    .limit(1);
  if (!membership) {
    res.status(403).json({ error: "You do not have access to this workspace." });
    return;
  }

  try {
    await db.update(dataSourcesTable).set({ status: "syncing" }).where(eq(dataSourcesTable.id, source.id));
    const rows = parseLedgerCsv(parsed.data.csv);
    await importLedgerRows(source.workspaceId, source.id, rows);
    const firingCount = await evaluateAlertRules(source.workspaceId);

    const [updated] = await db.select().from(dataSourcesTable).where(eq(dataSourcesTable.id, source.id)).limit(1);
    res.json({ dataSource: updated, rowsImported: rows.length, alertsTriggered: firingCount });
  } catch (error) {
    if (error instanceof LedgerImportError) {
      res.status(422).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post("/data-sources/:dataSourceId/resync", requireWorkspaceAccess, async (req, res) => {
  const [source] = await db
    .select()
    .from(dataSourcesTable)
    .where(and(eq(dataSourcesTable.id, String(req.params.dataSourceId)), eq(dataSourcesTable.workspaceId, req.workspaceId!)))
    .limit(1);

  if (!source) {
    res.status(404).json({ error: "Data source not found." });
    return;
  }

  const [updated] = await db
    .update(dataSourcesTable)
    .set({ status: "syncing" })
    .where(eq(dataSourcesTable.id, source.id))
    .returning();
  res.json(updated);
});

export default router;
