import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { SectionHeading } from "@/components/primitives";
import { LoadingState, ErrorState } from "@/components/status";
import { Sparkline, TrendChart } from "@/components/charts";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceSummary } from "@/hooks/use-workspace-summary";
import { useCurrentUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { HeadlineMetric } from "@/lib/api-types";

function MetricCard({ metric }: { metric: HeadlineMetric }) {
  const positive = metric.direction === "positive";
  const negative = metric.direction === "negative";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4">
        <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="tabular-nums text-[23px] font-semibold tracking-[-.04em]">{metric.displayValue}</div>
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px] font-medium",
              positive && "text-positive",
              negative && "text-destructive",
              !positive && !negative && "text-muted-foreground",
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : negative ? <ArrowDownRight size={13} /> : null}
            {Math.abs(metric.delta)}
            {metric.key === "gross_margin" ? " pts" : "%"} {metric.deltaLabel}
          </div>
        </div>
        {metric.sparkline.length >= 2 && <Sparkline values={metric.sparkline} negative={negative} />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: me } = useCurrentUser();
  const { workspace } = useWorkspace();
  const summaryQuery = useWorkspaceSummary(workspace?.id);
  const firstName = me?.user.name.split(" ")[0];

  return (
    <AppShell>
      <div className="animate-rise">
        <SectionHeading
          eyebrow="Fiscal Insights / dashboard"
          title={firstName ? `Good to see you, ${firstName}.` : "Dashboard"}
          detail={summaryQuery.data ? `Here's the read on ${summaryQuery.data.workspace.name} — ${summaryQuery.data.workspace.periodLabel}.` : "Loading your workspace…"}
          action={
            <Link href="/app/assistant" className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground">
              Ask the assistant <Sparkles size={14} />
            </Link>
          }
        />

        {summaryQuery.isLoading && <LoadingState label="Loading dashboard" />}
        {summaryQuery.isError && <ErrorState message="Couldn't load the dashboard." onRetry={() => summaryQuery.refetch()} />}

        {summaryQuery.data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryQuery.data.metrics.map((metric) => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Operating trend</div>
                    <h2 className="mt-1 text-base font-semibold">Revenue vs. projection</h2>
                  </div>
                  <div className="flex gap-4 font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <i className="size-2 rounded-full bg-primary" /> Actual
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="size-2 rounded-full bg-accent" /> Projected
                    </span>
                  </div>
                </div>
                <TrendChart trend={summaryQuery.data.trend} />
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Recent activity</div>
                <div className="mt-4 space-y-4">
                  {summaryQuery.data.activity.length === 0 && <p className="text-xs text-muted-foreground">Nothing yet — import a ledger to see activity here.</p>}
                  {summaryQuery.data.activity.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.type === "alert" ? "bg-destructive" : "bg-accent")} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold">{item.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{item.detail}</div>
                        <div className="mt-1 font-mono text-[9px] text-muted-foreground">{item.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/app/reports" className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View reports
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
