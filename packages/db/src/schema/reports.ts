import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

export const reportStatuses = ["draft", "ready"] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const reportsTable = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  schedule: text("schedule").notNull().default("Manual"),
  status: text("status", { enum: reportStatuses }).notNull().default("draft"),
  recipients: integer("recipients").notNull().default(0),
  // A point-in-time capture of the metrics this report summarized, taken
  // when it was generated — real numbers, snapshotted, not fabricated copy.
  snapshot: jsonb("snapshot"),
  lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Report = typeof reportsTable.$inferSelect;
export type NewReport = typeof reportsTable.$inferInsert;
