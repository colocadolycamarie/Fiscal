import { db, alertFiringsTable, alertRulesTable, type AlertRule, type AlertSeverity } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { computeHeadlineMetrics } from "./metrics";

function severityFor(rule: AlertRule, magnitude: number): AlertSeverity {
  const threshold = Number(rule.thresholdValue);
  if (threshold === 0) return "medium";
  const overage = Math.abs(magnitude - threshold) / Math.abs(threshold);
  if (overage >= 0.25) return "high";
  if (overage >= 0.1) return "medium";
  return "low";
}

function evaluateCondition(rule: AlertRule, currentValue: number, delta: number): boolean {
  const threshold = Number(rule.thresholdValue);
  switch (rule.condition) {
    case "below":
      return currentValue < threshold;
    case "above":
      return currentValue > threshold;
    case "increases_by":
      return delta >= threshold;
    case "decreases_by":
      return delta <= -threshold;
    default:
      return false;
  }
}

const conditionCopy: Record<AlertRule["condition"], string> = {
  below: "dropped below",
  above: "rose above",
  increases_by: "increased by at least",
  decreases_by: "decreased by at least",
};

/**
 * Runs every active alert rule for a workspace against freshly computed
 * metrics. Any rule whose condition is met gets a new firing row with a
 * narrative built from the real numbers involved — no canned text.
 */
export async function evaluateAlertRules(workspaceId: string): Promise<number> {
  const rules = await db.select().from(alertRulesTable).where(and(eq(alertRulesTable.workspaceId, workspaceId), eq(alertRulesTable.active, true)));
  if (rules.length === 0) return 0;

  const metrics = await computeHeadlineMetrics(workspaceId);
  let firingCount = 0;

  for (const rule of rules) {
    const metric = metrics.find((m) => m.key === rule.metricKey);
    if (!metric || !Number.isFinite(metric.value)) continue;

    const triggered = evaluateCondition(rule, metric.value, metric.delta);
    if (!triggered) continue;

    const narrative = `${metric.label} ${conditionCopy[rule.condition]} ${rule.thresholdValue}. Current value: ${metric.displayValue} (${metric.delta >= 0 ? "+" : ""}${metric.delta}${metric.deltaLabel ? ` ${metric.deltaLabel}` : ""}).`;

    await db.insert(alertFiringsTable).values({
      workspaceId,
      ruleId: rule.id,
      narrative,
      value: metric.displayValue,
      severity: severityFor(rule, metric.value),
    });

    await db.update(alertRulesTable).set({ lastTriggeredAt: new Date() }).where(eq(alertRulesTable.id, rule.id));
    firingCount += 1;
  }

  return firingCount;
}
