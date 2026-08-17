import { AlertCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/primitives";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="skeleton h-3 w-32 rounded" />
      <div className="skeleton h-7 w-64 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <span className="sr-only" role="status">
        {label}
      </span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-7 text-center">
      <AlertCircle className="mx-auto text-destructive" size={22} />
      <p className="mt-3 text-sm font-semibold">{message ?? "Something went wrong."}</p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-12 text-center">
      <Icon className="mx-auto text-accent" size={26} />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{detail}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
