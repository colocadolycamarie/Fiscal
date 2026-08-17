import { useMemo, useState } from "react";
import { BookOpen, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, SectionHeading } from "@/components/primitives";
import { ErrorState, LoadingState } from "@/components/status";
import { useWorkspace } from "@/hooks/use-workspace";
import { useMetric, useMetrics } from "@/hooks/use-metrics";
import { cn } from "@/lib/utils";

export default function MetricsPage() {
  const { workspace } = useWorkspace();
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>();
  const metricsQuery = useMetrics(workspace?.id);
  const metricQuery = useMetric(workspace?.id, selectedKey);
  const metrics = metricsQuery.data ?? [];

  const filtered = useMemo(
    () => metrics.filter((metric) => `${metric.name} ${metric.key} ${metric.category}`.toLowerCase().includes(search.toLowerCase())),
    [metrics, search],
  );

  return (
    <AppShell>
      <SectionHeading eyebrow="Data dictionary" title="Metric library" detail="The canonical definitions behind every answer, with their current computed value." />

      <div className="grid gap-5 lg:grid-cols-[1fr_350px]">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                aria-label="Search metrics"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search metrics…"
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <Badge>{filtered.length} metrics</Badge>
          </div>

          {metricsQuery.isLoading ? (
            <div className="p-4">
              <LoadingState label="Loading metrics" />
            </div>
          ) : metricsQuery.isError ? (
            <div className="p-4">
              <ErrorState message="Couldn't load the metric catalog." onRetry={() => metricsQuery.refetch()} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-mono text-[9px] uppercase tracking-[.08em] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Metric</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 text-right font-medium">Current value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((metric) => (
                    <tr
                      key={metric.id}
                      onClick={() => setSelectedKey(metric.key)}
                      className={cn("cursor-pointer border-b border-border/70 transition hover:bg-muted", selectedKey === metric.key && "bg-secondary")}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{metric.name}</div>
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">{metric.key}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{metric.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{metric.owner}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{metric.currentValue ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">No definitions match "{search}".</div>}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24 lg:h-fit">
          {metricQuery.isLoading ? (
            <LoadingState label="Loading metric definition" />
          ) : metricQuery.data ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge tone="accent">{metricQuery.data.category}</Badge>
                  <h2 className="mt-3 font-display text-2xl">{metricQuery.data.name}</h2>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">{metricQuery.data.key}</div>
                </div>
                <button onClick={() => setSelectedKey(undefined)} className="focus-ring text-muted-foreground" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-6 space-y-5">
                <div>
                  <span className="label">Formula</span>
                  <div className="mt-2 rounded-md bg-muted p-3 font-mono text-[11px] leading-5">{metricQuery.data.formula}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="label">Owner</span>
                    <div className="mt-1 text-xs font-semibold">{metricQuery.data.owner}</div>
                  </div>
                  <div>
                    <span className="label">Source</span>
                    <div className="mt-1 text-xs font-semibold">{metricQuery.data.source}</div>
                  </div>
                </div>
                {metricQuery.data.synonyms.length > 0 && (
                  <div>
                    <span className="label">Also called</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {metricQuery.data.synonyms.map((word) => (
                        <Badge key={word}>{word}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <BookOpen className="mx-auto text-accent" size={25} />
              <h3 className="mt-4 font-display text-xl">Select a metric</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Inspect the formula, ownership, and current value for any metric.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
