import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight } from "lucide-react";
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-10">
      <div className="mb-10">
        <Logo />
      </div>
      <div className="w-full max-w-[420px]">
        <div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Create your workspace</div>
        <h1 className="mt-3 font-display text-4xl tracking-[-.045em]">Set up Fiscal Insights.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">One workspace, one owner account — invite teammates later.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Your name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div>
            <label htmlFor="workspaceName" className="label">
              Workspace name
            </label>
            <input
              id="workspaceName"
              required
              placeholder="Acme Inc."
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">At least 8 characters.</p>
          </div>

          {signup.isError && (
            <p role="alert" className="text-xs text-destructive">
              {signup.error instanceof ApiError ? signup.error.message : "Something went wrong."}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={signup.isPending}>
            {signup.isPending ? "Creating workspace…" : "Create workspace"} <ArrowUpRight size={15} />
          </Button>
        </form>

        <p className="mt-8 border-t border-border pt-5 text-[11px] leading-5 text-muted-foreground">
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
