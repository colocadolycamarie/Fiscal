import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Settings2,
  Sparkles,
  Table2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import logoMark from "@/assets/logo.png";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/assistant", label: "Assistant", icon: Sparkles },
  { href: "/app/metrics", label: "Metric library", icon: Table2 },
  { href: "/app/connections", label: "Connections", icon: Network },
  { href: "/app/reports", label: "Reports", icon: FileBarChart },
  { href: "/app/alerts", label: "Alerts", icon: Bell },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/app" className={cn("flex items-center gap-2.5 focus-ring", dark ? "text-sidebar-foreground" : "text-foreground")}>
      <img src={logoMark} alt="" className="size-8 rounded-md object-cover" />
      <span className="font-display text-[19px] tracking-[-.03em]">Fiscal Insights</span>
    </Link>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const { data: me } = useCurrentUser();
  const { workspace, workspaces, selectWorkspace } = useWorkspace();
  const logout = useLogout();
  const active = NAV_ITEMS.find((item) => location === item.href || (item.href !== "/app" && location.startsWith(item.href)))?.href ?? (location === "/app" ? "/app" : undefined);

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[236px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-200 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-9 flex items-center justify-between px-2">
          <Logo dark />
          <button onClick={() => setMenuOpen(false)} className="text-sidebar-foreground/70 lg:hidden" aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        {workspace && (
          <div className="mb-6">
            <div className="mb-3 px-2 font-mono text-[9px] uppercase tracking-[.16em] text-sidebar-foreground/50">Workspace</div>
            {workspaces.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setWorkspaceMenuOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-md border border-sidebar-border px-2.5 py-2 text-left hover:bg-sidebar-accent"
                  aria-expanded={workspaceMenuOpen}
                >
                  <span>
                    <span className="block text-xs font-semibold">{workspace.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-sidebar-foreground/55">Finance / {workspace.baseCurrency}</span>
                  </span>
                  <ChevronDown size={14} className={cn("text-sidebar-foreground/55 transition-transform", workspaceMenuOpen && "rotate-180")} />
                </button>
                {workspaceMenuOpen && (
                  <div className="mt-1 space-y-1 rounded-md border border-sidebar-border bg-sidebar p-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          selectWorkspace(ws.id);
                          setWorkspaceMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left hover:bg-sidebar-accent",
                          ws.id === workspace.id && "bg-sidebar-accent",
                        )}
                      >
                        <span className="text-xs font-semibold">{ws.name}</span>
                        {ws.id === workspace.id && <Check size={13} className="text-sidebar-foreground/55" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-sidebar-border px-2.5 py-2">
                <span className="block text-xs font-semibold">{workspace.name}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-sidebar-foreground/55">Finance / {workspace.baseCurrency}</span>
              </div>
            )}
          </div>
        )}

        <nav aria-label="Main navigation" className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "focus-ring group flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[13px] transition-colors",
                active === href ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/66 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground",
              )}
            >
              <Icon size={16} strokeWidth={active === href ? 2.2 : 1.7} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1">
          <Link href="/app/settings" className="focus-ring flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[13px] text-sidebar-foreground/66 hover:bg-sidebar-accent">
            <Settings2 size={16} /> Settings
          </Link>
          <div className="mt-5 border-t border-sidebar-border pt-4">
            <div className="flex items-center gap-2.5 px-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent/22 font-mono text-[10px] text-accent">{me ? initials(me.user.name) : "—"}</span>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">{me?.user.name ?? "…"}</div>
                <div className="truncate text-[10px] text-sidebar-foreground/50">{me?.user.email ?? ""}</div>
              </div>
              <button
                onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/login") })}
                disabled={logout.isPending}
                className="ml-auto rounded-md p-1.5 text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-50"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-20 bg-foreground/20 lg:hidden" />}

      <main className="lg:pl-[236px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="focus-ring rounded-md p-1.5 lg:hidden" aria-label="Open navigation">
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span>{workspace?.name ?? "Fiscal Insights"}</span>
              <ChevronRight size={13} />
              <span className="text-foreground">{NAV_ITEMS.find((item) => item.href === active)?.label ?? "Settings"}</span>
            </div>
            <div className="sm:hidden">
              <Logo />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
