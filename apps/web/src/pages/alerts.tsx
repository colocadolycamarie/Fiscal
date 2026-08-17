import { useState } from "react";
import { AlertCircle, Bell, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, SectionHeading } from "@/components/primitives";
import { EmptyState, LoadingState } from "@/components/status";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAlertFeed, useAlertRules, useCreateAlertRule, useToggleAlertRule } from "@/hooks/use-alerts";
import { cn } from "@/lib/utils";
import type { AlertRule } from "@/lib/api-types";

const METRIC_OPTIONS: { value: AlertRule["metricKey"]; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "gross_margin", label: "Gross margin" },
  { value: "burn_rate", label: "Net burn" },
  { value: "runway", label: "Runway" },
];

const CONDITION_OPTIONS: { value: AlertRule["condition"]; label: string }[] = [
  { value: "below", label: "falls below" },
  { value: "above", label: "rises above" },
  { value: "increases_by", label: "increases by at least" },
  { value: "decreases_by", label: "decreases by at least" },
];

function formatDate(value: string | null) {
  if (!value) return "never";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AlertsPage() {
  const { workspace } = useWorkspace();
  const [showAdd, setShowAdd] = useState(false);
  const [metricKey, setMetricKey] = useState<AlertRule["metricKey"]>("gross_margin");
  const [condition, setCondition] = useState<AlertRule["condition"]>("below");
  const [threshold, setThreshold] = useState("");

  const rulesQuery = useAlertRules(workspace?.id);
  const feedQuery = useAlertFeed(workspace?.id);
  const create = useCreateAlertRule(workspace?.id);
  const toggle = useToggleAlertRule(workspace?.id);
  const rules = rulesQuery.data ?? [];
  const feed = feedQuery.data ?? [];

  function handleCreate() {
    const value = Number(threshold);
    if (Number.isNaN(value)) return;
    create.mutate({ metricKey, condition, thresholdValue: value }, { onSuccess: () => { setThreshold(""); setShowAdd(false); } });
  }

  return (
    <AppShell>
      <SectionHeading
        eyebrow="Exceptions, not noise"
        title="Alerts"
        detail="Rules watch your live metrics; a firing here means the condition was actually met."
        action={
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus size={15} /> New rule
          </Button>
        }
      />

      {showAdd && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-accent/45 bg-accent/8 p-4">
          <div>
            <label className="label" htmlFor="alert-metric">
              Metric
            </label>
            <select id="alert-metric" value={metricKey} onChange={(e) => setMetricKey(e.target.value as AlertRule["metricKey"])} className="mt-2 h-10 rounded-md border border-border bg-card px-3 text-sm">
              {METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="alert-condition">
              Condition
            </label>
            <select id="alert-condition" value={condition} onChange={(e) => setCondition(e.target.value as AlertRule["condition"])} className="mt-2 h-10 rounded-md border border-border bg-card px-3 text-sm">
              {CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="alert-threshold">
              Threshold
            </label>
            <input
              id="alert-threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 65"
              className="mt-2 h-10 w-28 rounded-md border border-border bg-card px-3 text-sm"
            />
          </div>
          <Button onClick={handleCreate} disabled={create.isPending || !threshold}>
            Create rule
          </Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Active rules</span>
            <Badge>{rules.length} rules</Badge>
          </div>
          {rulesQuery.isLoading ? (
            <div className="p-4">
              <LoadingState label="Loading rules" />
            </div>
          ) : rules.length === 0 ? (
            <EmptyState icon={Bell} title="No alert rules yet" detail="Add one to watch a metric for a material change." />
          ) : (
            rules.map((rule) => {
              const metricLabel = METRIC_OPTIONS.find((option) => option.value === rule.metricKey)?.label ?? rule.metricKey;
              const conditionLabel = CONDITION_OPTIONS.find((option) => option.value === rule.condition)?.label ?? rule.condition;
              return (
                <div key={rule.id} className="flex items-center justify-between gap-3 border-b border-border/70 p-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-1.5 size-2 rounded-full", rule.active ? "bg-positive" : "bg-muted-foreground")} />
                    <div>
                      <div className="text-sm font-semibold">
                        {metricLabel} <span className="font-normal text-muted-foreground">{conditionLabel} {rule.thresholdValue}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {rule.channel} · Last triggered {formatDate(rule.lastTriggeredAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle.mutate({ ruleId: rule.id, active: !rule.active })}
                    className="focus-ring rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    {rule.active ? "On" : "Off"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Alert feed</span>
          </div>
          {feed.length === 0 ? (
            <EmptyState icon={Bell} title="Quiet so far" detail="When a rule fires against real data, the narrative lands here." />
          ) : (
            feed.map((item) => (
              <div key={item.id} className="flex gap-3 border-b border-border/70 p-4 last:border-0">
                <span
                  className={cn(
                    "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full",
                    item.severity === "high" ? "bg-destructive/12 text-destructive" : "bg-accent/15 text-primary",
                  )}
                >
                  <AlertCircle size={13} />
                </span>
                <div>
                  <p className="text-xs leading-5 text-muted-foreground">{item.narrative}</p>
                  <div className="mt-2 font-mono text-[9px] text-muted-foreground">
                    {item.value} · {formatDate(item.firedAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
