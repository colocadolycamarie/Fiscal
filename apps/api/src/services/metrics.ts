import { db, transactionsTable } from "@workspace/db";
import { and, eq, gte, lt, sql } from "drizzle-orm";

export interface MonthRange {
  start: Date;
  end: Date;
  label: string;
}

/** Returns the last `count` calendar months, oldest first, ending with the current month. */
export function trailingMonths(count: number, reference = new Date()): MonthRange[] {
  const months: MonthRange[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    months.push({ start, end, label: start.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) });
  }
  return months;
}

interface AccountTotals {
  revenueCents: number;
  cogsCents: number;
  opexCents: number;
  cashCents: number;
}

/** Sums each ledger account for a workspace within [start, end). All in integer cents. */
export async function sumAccountsForRange(workspaceId: string, range: { start: Date; end: Date }): Promise<AccountTotals> {
  const rows = await db
    .select({
      account: transactionsTable.account,
      total: sql<string>`coalesce(sum(${transactionsTable.amountCents}), 0)`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.workspaceId, workspaceId),
        gte(transactionsTable.occurredOn, range.start),
        lt(transactionsTable.occurredOn, range.end),
      ),
    )
    .groupBy(transactionsTable.account);

  const totals: AccountTotals = { revenueCents: 0, cogsCents: 0, opexCents: 0, cashCents: 0 };
  for (const row of rows) {
    const value = Number(row.total);
    // Ledger exports vary on whether cost accounts are signed negative
    // (a reduction) or positive (a magnitude). Costs are always treated as
    // a magnitude here so margin/burn formulas stay correct either way.
    if (row.account === "revenue") totals.revenueCents = value;
    else if (row.account === "cogs") totals.cogsCents = Math.abs(value);
    else if (row.account === "opex") totals.opexCents = Math.abs(value);
    else if (row.account === "cash") totals.cashCents = value;
  }
  return totals;
}

/** Cumulative cash balance up to (but not including) `asOf`. */
export async function cashBalanceAsOf(workspaceId: string, asOf: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${transactionsTable.amountCents}), 0)` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.workspaceId, workspaceId),
        eq(transactionsTable.account, "cash"),
        lt(transactionsTable.occurredOn, asOf),
      ),
    );
  return Number(row?.total ?? 0);
}

export interface HeadlineMetric {
  key: string;
  label: string;
  value: number;
  displayValue: string;
  delta: number;
  deltaLabel: string;
  direction: "positive" | "negative" | "neutral";
  sparkline: number[];
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  const abs = Math.abs(dollars);
  const sign = dollars < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Computes the four headline metrics — revenue, gross margin, net burn, runway —
 * plus a 12-point sparkline for each, entirely from stored transactions.
 */
export async function computeHeadlineMetrics(workspaceId: string): Promise<HeadlineMetric[]> {
  const months = trailingMonths(12);
  const monthlyTotals = await Promise.all(months.map((range) => sumAccountsForRange(workspaceId, range)));

  const current = monthlyTotals[monthlyTotals.length - 1]!;
  const previous = monthlyTotals[monthlyTotals.length - 2] ?? current;

  const currentGrossMargin = current.revenueCents === 0 ? 0 : ((current.revenueCents - current.cogsCents) / current.revenueCents) * 100;
  const previousGrossMargin = previous.revenueCents === 0 ? 0 : ((previous.revenueCents - previous.cogsCents) / previous.revenueCents) * 100;

  const currentBurn = current.cogsCents + current.opexCents - current.revenueCents;
  const previousBurn = previous.cogsCents + previous.opexCents - previous.revenueCents;

  const cashNow = await cashBalanceAsOf(workspaceId, months[months.length - 1]!.end);
  const cashLastMonth = await cashBalanceAsOf(workspaceId, months[months.length - 1]!.start);

  const trailingBurn = monthlyTotals.slice(-3).reduce((sum, m) => sum + (m.cogsCents + m.opexCents - m.revenueCents), 0) / 3;
  const runwayMonths = trailingBurn <= 0 ? Infinity : cashNow / trailingBurn;
  const prevTrailingBurn =
    monthlyTotals.slice(-4, -1).reduce((sum, m) => sum + (m.cogsCents + m.opexCents - m.revenueCents), 0) / 3 || trailingBurn;
  const prevRunwayMonths = prevTrailingBurn <= 0 ? runwayMonths : cashLastMonth / prevTrailingBurn;

  return [
    {
      key: "revenue",
      label: "Revenue",
      value: current.revenueCents / 100,
      displayValue: formatCurrency(current.revenueCents),
      delta: Math.round(percentChange(current.revenueCents, previous.revenueCents) * 10) / 10,
      deltaLabel: "vs. last month",
      direction: current.revenueCents >= previous.revenueCents ? "positive" : "negative",
      sparkline: monthlyTotals.map((m) => m.revenueCents / 100),
    },
    {
      key: "gross_margin",
      label: "Gross margin",
      value: Math.round(currentGrossMargin * 10) / 10,
      displayValue: `${currentGrossMargin.toFixed(1)}%`,
      delta: Math.round((currentGrossMargin - previousGrossMargin) * 10) / 10,
      deltaLabel: "vs. last month",
      direction: currentGrossMargin >= previousGrossMargin ? "positive" : "negative",
      sparkline: monthlyTotals.map((m) => (m.revenueCents === 0 ? 0 : ((m.revenueCents - m.cogsCents) / m.revenueCents) * 100)),
    },
    {
      key: "burn_rate",
      label: "Net burn",
      value: currentBurn / 100,
      displayValue: formatCurrency(currentBurn),
      delta: Math.round(percentChange(currentBurn, previousBurn) * 10) / 10,
      // Lower burn is good, so a negative percent change is the positive direction.
      deltaLabel: "vs. last month",
      direction: currentBurn <= previousBurn ? "positive" : "negative",
      sparkline: monthlyTotals.map((m) => (m.cogsCents + m.opexCents - m.revenueCents) / 100),
    },
    {
      key: "runway",
      label: "Runway",
      // JSON has no Infinity; use a large-but-finite sentinel for "cash flow positive"
      // so alert-rule comparisons (e.g. "runway below 6 months") behave correctly.
      value: Number.isFinite(runwayMonths) ? Math.round(runwayMonths * 10) / 10 : 9999,
      displayValue: Number.isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} mo` : "Cash flow positive",
      delta: Number.isFinite(runwayMonths) && Number.isFinite(prevRunwayMonths) ? Math.round((runwayMonths - prevRunwayMonths) * 10) / 10 : 0,
      deltaLabel: "vs. last month",
      direction: runwayMonths >= prevRunwayMonths ? "positive" : "negative",
      sparkline: [],
    },
  ];
}

export interface TrendPoint {
  label: string;
  revenue: number;
  grossProfit: number;
  forecast: number;
}

/** Six months of real revenue/gross-profit plus one naive-projection point based on trailing MoM growth. */
export async function computeRevenueTrend(workspaceId: string): Promise<TrendPoint[]> {
  const months = trailingMonths(6);
  const totals = await Promise.all(months.map((range) => sumAccountsForRange(workspaceId, range)));

  const points: TrendPoint[] = months.map((range, i) => ({
    label: range.label,
    revenue: totals[i]!.revenueCents / 100,
    grossProfit: (totals[i]!.revenueCents - totals[i]!.cogsCents) / 100,
    forecast: 0,
  }));

  const growthRates: number[] = [];
  for (let i = 1; i < totals.length; i++) {
    const prev = totals[i - 1]!.revenueCents;
    const cur = totals[i]!.revenueCents;
    if (prev > 0) growthRates.push((cur - prev) / prev);
  }
  const avgGrowth = growthRates.length ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;
  const lastRevenue = totals[totals.length - 1]!.revenueCents;
  const nextMonthLabel = new Date(Date.UTC(months[months.length - 1]!.start.getUTCFullYear(), months[months.length - 1]!.start.getUTCMonth() + 1, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" });

  points.push({
    label: nextMonthLabel,
    revenue: 0,
    grossProfit: 0,
    forecast: Math.round((lastRevenue * (1 + avgGrowth)) / 100),
  });

  return points;
}
