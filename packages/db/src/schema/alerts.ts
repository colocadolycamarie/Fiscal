import { boolean, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

export const alertConditions = ["below", "above", "increases_by", "decreases_by"] as const;
export type AlertCondition = (typeof alertConditions)[number];

export const alertRulesTable = pgTable("alert_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  metricKey: text("metric_key").notNull(),
  condition: text("condition", { enum: alertConditions }).notNull(),
  // Threshold is unit-agnostic: a percent (margin, growth) or a currency
  // amount (burn), interpreted alongside the metric's own unit.
  thresholdValue: numeric("threshold_value", { precision: 14, scale: 2 }).notNull(),
  channel: text("channel").notNull().default("In-app"),
  active: boolean("active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AlertRule = typeof alertRulesTable.$inferSelect;
export type NewAlertRule = typeof alertRulesTable.$inferInsert;

export const alertSeverities = ["low", "medium", "high"] as const;
export type AlertSeverity = (typeof alertSeverities)[number];

export const alertFiringsTable = pgTable("alert_firings", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => alertRulesTable.id, { onDelete: "cascade" }),
  narrative: text("narrative").notNull(),
  value: text("value").notNull(),
  severity: text("severity", { enum: alertSeverities }).notNull(),
  firedAt: timestamp("fired_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AlertFiring = typeof alertFiringsTable.$inferSelect;
export type NewAlertFiring = typeof alertFiringsTable.$inferInsert;
