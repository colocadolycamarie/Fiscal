import { useState } from "react";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, SectionHeading } from "@/components/primitives";
import { EmptyState, LoadingState } from "@/components/status";
import { useWorkspace } from "@/hooks/use-workspace";
import { useCreateReport, useGenerateReport, useReports } from "@/hooks/use-reports";
import { cn } from "@/lib/utils";

function formatDate(value: string | null) {
  if (!value) return "Not yet generated";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ReportsPage() {
  const { workspace } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Board operating review");
  const [selectedId, setSelectedId] = useState<string>();

  const query = useReports(workspace?.id);
  const create = useCreateReport(workspace?.id);
  const generate = useGenerateReport(workspace?.id);
  const reports = query.data ?? [];
  const selected = reports.find((report) => report.id === selectedId) ?? reports[0];

  function handleCreate() {
    create.mutate(
      { name: name.trim() || "Untitled report", type },
      { onSuccess: () => { setName(""); setShowCreate(false); } },
    );
  }

  return (
    <AppShell>
      <SectionHeading
        eyebrow="Board-ready outputs"
        title="Reports"
        detail="Generate a snapshot of your current metrics at any time."
        action={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus size={15} /> New report
          </Button>
        }
      />

      {showCreate && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-accent/45 bg-accent/8 p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label" htmlFor="report-name">
              Report name
            </label>
            <input
              id="report-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="June operating review"
              className="mt-2 h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none"
            />
          </div>
          <div className="w-full sm:w-56">
            <label className="label" htmlFor="report-type">
              Type
            </label>
            <select id="report-type" value={type} onChange={(e) => setType(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
              <option>Board operating review</option>
              <option>Cash & runway</option>
              <option>Monthly close</option>
            </select>
          </div>
          <Button onClick={handleCreate} disabled={create.isPending}>
            Save report
          </Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.35fr]">
        <div className="rounded-lg border border-border bg-card p-3">
          {query.isLoading ? (
            <LoadingState label="Loading reports" />
          ) : reports.length === 0 ? (
            <EmptyState icon={FileText} title="No saved reports" detail="Create one to start your report shelf." />
          ) : (
            reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedId(report.id)}
                className={cn("w-full rounded-md border-b border-border p-4 text-left last:border-0 hover:bg-muted", report.id === selected?.id && "bg-secondary")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{report.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{report.type}</div>
                  </div>
                  <Badge tone={report.status === "ready" ? "positive" : "accent"}>{report.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[9px] text-muted-foreground">
                  <span>{report.schedule}</span>
                  <span>{formatDate(report.lastGeneratedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="ledger-grid min-h-[430px] rounded-lg border border-border bg-card p-6 sm:p-9">
          {!selected ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <FileText className="mx-auto text-muted-foreground" size={26} />
              <h3 className="mt-3 font-display text-xl">Your report shelf is empty</h3>
              <p className="mt-1 text-xs text-muted-foreground">Create a report to preview it here.</p>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              <div className="flex items-start justify-between border-b border-border pb-5">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{workspace?.name}</div>
                  <h2 className="mt-3 font-display text-3xl tracking-[-.04em]">{selected.name}</h2>
                  <p className="mt-2 text-xs text-muted-foreground">{selected.type} · {formatDate(selected.lastGeneratedAt)}</p>
                </div>
                <Button variant="outline" onClick={() => generate.mutate(selected.id)} disabled={generate.isPending}>
                  <RefreshCw size={14} className={generate.isPending ? "animate-spin" : ""} /> Generate
                </Button>
              </div>

              {selected.snapshot ? (
                <>
                  <div className="grid grid-cols-3 gap-4 border-b border-border py-6">
                    {selected.snapshot.metrics.slice(0, 3).map((metric) => (
                      <div key={metric.key}>
                        <span className="label">{metric.label}</span>
                        <strong className="mt-1 block tabular-nums text-xl">{metric.displayValue}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-xs leading-5 text-muted-foreground">
                    Snapshot captured {new Date(selected.snapshot.generatedAt).toLocaleString()}. All figures are sourced from the connected ledger at that moment.
                  </p>
                </>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">Not generated yet — click Generate to capture a live snapshot of your metrics.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
