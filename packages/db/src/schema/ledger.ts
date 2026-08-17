import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

// A data source is anything that can feed transactions into a workspace's
// ledger: a CSV import today, an OAuth-connected accounting/billing
// provider tomorrow. `provider` identifies where the rows came from;
// `status`/`lastSyncAt`/`rowCount` reflect the most recent ingest.
export const dataSourceStatuses = ["connecting", "syncing", "ready", "error"] as const;
export type DataSourceStatus = (typeof dataSourceStatuses)[number];

export const dataSourcesTable = pgTable("data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  label: text("label").notNull(),
  status: text("status", { enum: dataSourceStatuses }).notNull().default("connecting"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  rowCount: integer("row_count").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DataSource = typeof dataSourcesTable.$inferSelect;
export type NewDataSource = typeof dataSourcesTable.$inferInsert;

// A single ledger line. Every headline metric (revenue, COGS, gross
// margin, burn, runway, ARR) is derived from these rows at query time —
// there is no separate table of pre-computed, hardcoded numbers.
export const ledgerAccounts = ["revenue", "cogs", "opex", "cash"] as const;
export type LedgerAccount = (typeof ledgerAccounts)[number];

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  dataSourceId: uuid("data_source_id").references(() => dataSourcesTable.id, {
    onDelete: "set null",
  }),
  occurredOn: timestamp("occurred_on", { withTimezone: true, mode: "date" }).notNull(),
  account: text("account", { enum: ledgerAccounts }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  // Stored in integer cents to avoid floating-point rounding in totals.
  amountCents: integer("amount_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;
