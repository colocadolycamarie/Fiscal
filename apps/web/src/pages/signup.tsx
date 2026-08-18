import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/app-shell";
import { Button } from "@/components/primitives";
import { useSignup } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const signup = useSignup();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    signup.mutate({ name, email, password, workspaceName }, { onSuccess: () => setLocation("/app") });
  }

  return (
    <div className="ledger-grid flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-[440px] rounded-lg border border-border bg-card p-7 shadow-sm sm:p-9">
        <div className="flex justify-center">
          <Logo stacked />
        </div>

        <div className="mt-7 font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">Create your workspace</div>
        <h1 className="mt-2.5 font-display text-4xl tracking-[-.045em]">Set up Fiscal Insights.</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-foreground">
              Your name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div>
            <label htmlFor="workspaceName" className="text-sm font-semibold text-foreground">
              Workspace name
            </label>
            <input
              id="workspaceName"
              required
              placeholder="Acme Inc."
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring/30"
            />
            <p className="mt-1.5 text-sm text-muted-foreground">At least 8 characters.</p>
          </div>

          {signup.isError && (
            <p role="alert" className="text-sm text-destructive">
              {signup.error instanceof ApiError ? signup.error.message : "Something went wrong."}
            </p>
          )}

          <Button type="submit" className="h-12 w-full text-base" disabled={signup.isPending}>
            {signup.isPending ? "Creating workspace…" : "Create workspace"}
          </Button>
        </form>

        <p className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-foreground underline">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
