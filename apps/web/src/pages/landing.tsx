import { Link } from "wouter";
import { ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { Badge } from "@/components/primitives";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Logo />
        <div className="flex items-center gap-5">
          <Link href="/login" className="focus-ring text-xs font-semibold hover:text-primary">
            Sign in <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <div className="ledger-grid mx-4 overflow-hidden rounded-xl border border-border sm:mx-8 lg:mx-10">
        <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:px-14 lg:pb-28 lg:pt-28">
          <div className="max-w-[700px] animate-rise">
            <Badge tone="accent">Private financial intelligence</Badge>
            <h1 className="mt-6 font-display text-[clamp(3.2rem,8vw,7.5rem)] leading-[.94] tracking-[-.065em]">
              A sharper
              <br />
              <em className="text-primary">read</em> on the numbers.
            </h1>
            <p className="mt-7 max-w-lg text-[15px] leading-7 text-muted-foreground">
              Fiscal Insights turns plain-language questions into answers grounded in your own ledger — with the reasoning and source rows to back them up.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                Create your workspace <ArrowUpRight size={16} />
              </Link>
              <Link href="/login" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-semibold hover:bg-muted">
                Sign in
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-6 border-t border-border pt-5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <LockKeyhole size={14} /> Private by design
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} /> Evidence attached to every answer
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl border-t border-border px-6 py-16 lg:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="border-l-2 border-accent px-5">
            <div className="font-mono text-3xl text-primary">01</div>
            <h3 className="mt-4 font-semibold">Import your ledger</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Bring in revenue, cost, and cash data as a CSV export today — connectors are added as they're built.</p>
          </div>
          <div className="border-l-2 border-border px-5">
            <div className="font-mono text-3xl text-primary">02</div>
            <h3 className="mt-4 font-semibold">Ask in plain language</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Every answer is computed live from your data — margin, burn, runway, revenue — never canned.</p>
          </div>
          <div className="border-l-2 border-border px-5">
            <div className="font-mono text-3xl text-primary">03</div>
            <h3 className="mt-4 font-semibold">Watch for what matters</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Set alert rules on any metric, and generate board-ready report snapshots on demand.</p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-7 text-xs text-muted-foreground lg:px-10">
        <Logo />
        <span>Financial clarity for people carrying the number.</span>
      </footer>
    </div>
  );
}
