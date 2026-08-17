import { Gauge, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, SectionHeading } from "@/components/primitives";
import { ErrorState, LoadingState } from "@/components/status";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceSettings } from "@/hooks/use-settings";
import type { ReactNode } from "react";

function SettingGroup({ icon: Icon, title, detail, children }: { icon: typeof Gauge; title: string; detail: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3 border-b border-border pb-4">
        <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon size={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 py-3 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { workspace } = useWorkspace();
  const settingsQuery = useWorkspaceSettings(workspace?.id);

  return (
    <AppShell>
      <SectionHeading eyebrow="Workspace controls" title="Settings" detail="The identity and data policy for this workspace." />

      {settingsQuery.isLoading && <LoadingState label="Loading settings" />}
      {settingsQuery.isError && <ErrorState message="Couldn't load settings." onRetry={() => settingsQuery.refetch()} />}

      {settingsQuery.data && (
        <div className="max-w-3xl space-y-5">
          <SettingGroup icon={Gauge} title="Workspace identity" detail="How this workspace appears across Fiscal Insights.">
            <SettingRow label="Workspace name" value={settingsQuery.data.workspaceName} />
            <SettingRow label="Base currency" value={settingsQuery.data.baseCurrency} />
            <SettingRow label="Members" value={`${settingsQuery.data.memberCount} ${settingsQuery.data.memberCount === 1 ? "person" : "people"}`} />
          </SettingGroup>

          <SettingGroup icon={ShieldCheck} title="Data policy" detail="Your connected data is only available to members of this workspace.">
            <div className="flex items-center gap-3 rounded-md border border-positive/25 bg-positive/7 p-3 text-xs text-positive">
              <LockKeyhole size={15} /> {settingsQuery.data.dataPolicy}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Retention: {settingsQuery.data.retentionDays} days.</p>
          </SettingGroup>

          <SettingGroup icon={KeyRound} title="Account" detail="Session and sign-in management.">
            <Button variant="outline" disabled title="Coming soon">
              Manage sessions
            </Button>
          </SettingGroup>
        </div>
      )}
    </AppShell>
  );
}
