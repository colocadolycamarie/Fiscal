import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

// Documents *what a metric means and where it comes from*; the metric's
// current value is always computed live from transactionsTable, never
// stored here. Seeded once per workspace with the standard finance
// catalog (see apps/api/src/services/metrics.ts).
export const metricDefinitionsTable = pgTable("metric_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  formula: text("formula").notNull(),
  owner: text("owner").notNull(),
  source: text("source").notNull(),
  synonyms: jsonb("synonyms").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MetricDefinition = typeof metricDefinitionsTable.$inferSelect;
export type NewMetricDefinition = typeof metricDefinitionsTable.$inferInsert;
