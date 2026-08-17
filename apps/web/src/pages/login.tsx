import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { Button } from "@/components/primitives";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => setLocation("/app") },
    );
  }

  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_.82fr]">
      <div className="ledger-grid hidden flex-col justify-between p-10 lg:flex">
        <Logo />
        <div className="max-w-xl pb-10">
          <div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Private workspace</div>
          <h1 className="mt-5 font-display text-6xl leading-[1.02] tracking-[-.06em]">
            Come in.
            <br />
            The ledger is ready.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
            Fiscal Insights keeps the evidence close, so you can keep your attention on the decision.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Fiscal Insights</span>
      </div>

      <div className="flex flex-col justify-center px-6 py-10 sm:px-16">
        <div className="mb-14 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-[390px]">
          <div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Secure sign in</div>
          <h1 className="mt-3 font-display text-4xl tracking-[-.045em]">Back to the numbers.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with your workspace email.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            {login.isError && (
              <p role="alert" className="text-xs text-destructive">
                {login.error instanceof ApiError ? login.error.message : "Something went wrong."}
              </p>
            )}

            <Button type="submit" className="h-11 w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"} <ArrowUpRight size={15} />
            </Button>
          </form>

          <p className="mt-10 border-t border-border pt-5 text-[11px] leading-5 text-muted-foreground">
            New to Fiscal Insights?{" "}
            <Link href="/signup" className="font-semibold text-foreground underline">
              Create a workspace
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
