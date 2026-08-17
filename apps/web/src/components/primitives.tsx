import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "quiet" | "outline" | "danger";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={cn(
        "focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-semibold transition-transform duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-primary text-primary-foreground hover:brightness-110",
        variant === "quiet" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "outline" && "border border-border bg-card text-foreground hover:bg-muted",
        variant === "danger" && "border border-destructive/35 text-destructive hover:bg-destructive/8",
        className,
      )}
    >
      {children}
    </button>
  );
}

type BadgeTone = "neutral" | "positive" | "negative" | "accent";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.09em]",
        tone === "neutral" && "border-border bg-muted text-muted-foreground",
        tone === "accent" && "border-accent/40 bg-accent/15 text-foreground",
        tone === "positive" && "border-positive/35 bg-positive/10 text-positive",
        tone === "negative" && "border-destructive/30 bg-destructive/8 text-destructive",
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{eyebrow}</div>}
        <h1 className="font-display text-3xl tracking-[-.035em] text-foreground sm:text-[36px]">{title}</h1>
        {detail && <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  );
}
