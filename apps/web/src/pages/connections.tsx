import { useRef, useState } from "react";
import { Check, Database, Loader2, Pencil, Plus, RefreshCw, Trash2, UploadCloud, X as XIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, SectionHeading } from "@/components/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/status";
import { useWorkspace } from "@/hooks/use-workspace";
import { useCreateDataSource, useDataSources, useDeleteDataSource, useImportLedgerCsv, useRenameDataSource, useResyncDataSource } from "@/hooks/use-data-sources";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { DataSource } from "@/lib/api-types";

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusTone(status: DataSource["status"]) {
  if (status === "ready") return "positive" as const;
  if (status === "error") return "negative" as const;
  return "accent" as const;
}

function ConnectionRow({ connection }: { connection: DataSource }) {
  const { workspace } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string>();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(connection.label);
  const importCsv = useImportLedgerCsv(workspace?.id);
  const resync = useResyncDataSource(workspace?.id);
  const rename = useRenameDataSource(workspace?.id);
  const remove = useDeleteDataSource(workspace?.id);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportError(undefined);
    const csv = await file.text();
    importCsv.mutate(
      { dataSourceId: connection.id, csv },
      { onError: (error) => setImportError(error instanceof ApiError ? error.message : "Import failed.") },
    );
  }

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === connection.label) {
      setIsRenaming(false);
      setRenameValue(connection.label);
      return;
    }
    rename.mutate({ dataSourceId: connection.id, label: trimmed }, { onSuccess: () => setIsRenaming(false) });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${connection.label}"? Its imported transactions stay in your ledger, but the connection itself will be removed.`)) {
      return;
    }
    remove.mutate(connection.id);
  }

  return (
    <tr className="border-b border-border/70 last:border-0 align-top">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs font-semibold">
            {connection.label.slice(0, 2).toUpperCase()}
          </span>
          {isRenaming ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") {
                    setIsRenaming(false);
                    setRenameValue(connection.label);
                  }
                }}
                className="h-8 w-40 rounded-md border border-border bg-card px-2 text-xs outline-none focus:ring-2 focus:ring-ring/30"
              />
              <button onClick={handleRenameSubmit} disabled={rename.isPending} className="focus-ring rounded p-1 text-positive hover:bg-muted" aria-label="Save name">
                {rename.isPending ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
              </button>
              <button
                onClick={() => {
                  setIsRenaming(false);
                  setRenameValue(connection.label);
                }}
                className="focus-ring rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Cancel rename"
              >
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <div>
              <div className="font-semibold">{connection.label}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{connection.provider}</div>
            </div>
          )}
        </div>
        {importError && <p className="mt-2 max-w-xs text-[11px] text-destructive">{importError}</p>}
        {connection.errorMessage && !importError && <p className="mt-2 max-w-xs text-[11px] text-destructive">{connection.errorMessage}</p>}
      </td>
      <td className="px-5 py-4">
        <Badge tone={statusTone(connection.status)}>{connection.status}</Badge>
      </td>
      <td className="px-5 py-4 text-muted-foreground">{formatDate(connection.lastSyncAt)}</td>
      <td className="px-5 py-4 text-right font-mono tabular-nums">{connection.rowCount.toLocaleString()}</td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileSelected} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importCsv.isPending}>
            {importCsv.isPending ? <Loader2 className="animate-spin" size={14} /> : <UploadCloud size={14} />} Import CSV
          </Button>
          <Button variant="quiet" onClick={() => resync.mutate(connection.id)} disabled={resync.isPending}>
            <RefreshCw size={14} className={resync.isPending ? "animate-spin" : ""} /> Resync
          </Button>
          <button
            onClick={() => setIsRenaming(true)}
            disabled={isRenaming}
            className="focus-ring rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label="Rename connection"
            title="Rename"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={remove.isPending}
            className="focus-ring rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            aria-label="Delete connection"
            title="Delete"
          >
            {remove.isPending ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ConnectionsPage() {
  const { workspace } = useWorkspace();
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState("csv");
  const [label, setLabel] = useState("");
  const query = useDataSources(workspace?.id);
  const create = useCreateDataSource(workspace?.id);
  const connections = query.data ?? [];

  function handleCreate() {
    create.mutate(
      { provider, label: label.trim() || "Ledger export" },
      { onSuccess: () => { setLabel(""); setShowAdd(false); } },
    );
  }

  return (
    <AppShell>
      <SectionHeading
        eyebrow="Data layer"
        title="Connections"
        detail="Add a source, then import a ledger CSV export (columns: date,account,category,description,amount)."
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add connection
          </Button>
        }
      />

      {showAdd && (
        <div className="mb-5 rounded-lg border border-accent/45 bg-accent/8 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="label" htmlFor="source-label">
                Label
              </label>
              <input
                id="source-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. QuickBooks export"
                className="mt-2 h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="label" htmlFor="source-provider">
                Provider
              </label>
              <select
                id="source-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-2 h-10 rounded-md border border-border bg-card px-3 text-sm outline-none"
              >
                <option value="csv">CSV import</option>
                <option value="stripe">Stripe (manual export)</option>
                <option value="quickbooks">QuickBooks (manual export)</option>
                <option value="netsuite">NetSuite (manual export)</option>
              </select>
            </div>
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Add source
            </Button>
            <Button variant="quiet" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        {query.isLoading ? (
          <div className="p-4">
            <LoadingState label="Loading connections" />
          </div>
        ) : query.isError ? (
          <div className="p-4">
            <ErrorState message="Couldn't load connections." onRetry={() => query.refetch()} />
          </div>
        ) : connections.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No sources connected yet"
            detail="Add a source, then import a CSV to give the assistant real data to answer from."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className={cn("border-b border-border font-mono text-[9px] uppercase tracking-[.08em] text-muted-foreground")}>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last sync</th>
                  <th className="px-5 py-3 text-right font-medium">Rows</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {connections.map((connection) => (
                  <ConnectionRow key={connection.id} connection={connection} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
