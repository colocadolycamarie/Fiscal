import { cn } from "@/lib/utils";
import type { TrendPoint } from "@/lib/api-types";

export function Sparkline({ values, negative = false }: { values: number[]; negative?: boolean }) {
  if (values.length < 2) {
    return <div className="h-9 w-[92px] rounded bg-muted" aria-hidden="true" />;
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => `${(i / (values.length - 1)) * 100},${30 - ((value - min) / range) * 24}`).join(" ");
  const lastY = 30 - ((values[values.length - 1]! - min) / range) * 24;

  return (
    <svg viewBox="0 0 100 32" className={cn("h-9 w-[92px]", negative ? "text-destructive" : "text-primary")} aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy={lastY} r="2" fill="currentColor" />
    </svg>
  );
}

export function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const width = 640;
  const height = 210;
  const max = Math.max(1, ...trend.flatMap((point) => [point.revenue, point.forecast]));

  const pathFor = (key: "revenue" | "forecast") =>
    trend.map((point, i) => `${(i / Math.max(trend.length - 1, 1)) * width},${height - (point[key] / max) * 175 - 8}`).join(" ");

  return (
    <div className="relative mt-4 h-[230px] w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-x-0 bottom-3 top-6 h-[190px] w-full">
        <line x1="0" y1="20" x2={width} y2="20" stroke="hsl(var(--border))" strokeDasharray="3 5" />
        <line x1="0" y1="105" x2={width} y2="105" stroke="hsl(var(--border))" strokeDasharray="3 5" />
        <line x1="0" y1="195" x2={width} y2="195" stroke="hsl(var(--border))" strokeDasharray="3 5" />
        <polyline points={pathFor("forecast")} fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <polyline points={pathFor("revenue")} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[9px] text-muted-foreground">
        {trend.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

export function MiniLineChart({ labels, values }: { labels: string[]; values: number[] }) {
  if (!labels.length || !values.length) return <div className="h-36 rounded bg-muted" />;
  const width = 560;
  const height = 145;
  const max = Math.max(...values, 1);
  const points = values.map((value, i) => `${(i / Math.max(values.length - 1, 1)) * width},${height - (value / max) * 115 - 5}`).join(" ");

  return (
    <div className="min-w-[560px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full">
        <line x1="0" y1="25" x2={width} y2="25" stroke="hsl(var(--border))" strokeDasharray="3 4" />
        <line x1="0" y1="85" x2={width} y2="85" stroke="hsl(var(--border))" strokeDasharray="3 4" />
        <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.3" vectorEffect="non-scaling-stroke" />
        {values.map((value, i) => (
          <circle key={i} cx={(i / Math.max(values.length - 1, 1)) * width} cy={height - (value / max) * 115 - 5} r="2.5" fill="hsl(var(--accent))" />
        ))}
      </svg>
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
