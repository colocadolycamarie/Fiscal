import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
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
    <div className="ledger-grid flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-[440px] rounded-lg border border-border bg-card p-7 shadow-sm sm:p-9">
        <div className="flex justify-center">
          <Logo stacked />
        </div>

        <div className="mt-7 font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">Secure sign in</div>
        <h1 className="mt-2.5 font-display text-4xl tracking-[-.045em]">Back to the numbers.</h1>
        <p className="mt-2.5 text-base leading-6 text-muted-foreground">Sign in with your workspace email.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {login.isError && (
            <p role="alert" className="text-sm text-destructive">
              {login.error instanceof ApiError ? login.error.message : "Something went wrong."}
            </p>
          )}

          <Button type="submit" className="h-12 w-full text-base" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
          New to Fiscal Insights?{" "}
          <Link href="/signup" className="font-semibold text-foreground underline">
            Create a workspace
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
