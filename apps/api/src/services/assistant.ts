import { db, metricDefinitionsTable, transactionsTable, type LedgerAccount } from "@workspace/db";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { computeHeadlineMetrics, computeRevenueTrend, trailingMonths } from "./metrics";

export interface AssistantAnswer {
  id: string;
  question: string;
  headline: string;
  narrative: string;
  comparison: string;
  confidence: "high" | "medium" | "low";
  chart: {
    type: "line";
    labels: string[];
    series: { name: string; values: number[]; color: null }[];
  };
  evidence: {
    id: string;
    date: string;
    source: string;
    description: string;
    account: string;
    amount: number;
    status: string;
  }[];
  suggestedQuestions: string[];
  trace: { metric: string; method: string; period: string; sourceRows: number };
}

const INTENTS: { key: string; accounts: LedgerAccount[]; keywords: string[] }[] = [
  { key: "gross_margin", accounts: ["revenue", "cogs"], keywords: ["margin", "profitability"] },
  { key: "burn_rate", accounts: ["cogs", "opex"], keywords: ["burn", "spend", "expense", "cost"] },
  { key: "runway", accounts: ["cash"], keywords: ["runway", "cash", "months of cash"] },
  { key: "revenue", accounts: ["revenue"], keywords: ["revenue", "sales", "forecast", "next month"] },
];

function detectIntent(question: string): (typeof INTENTS)[number] {
  const normalized = question.toLowerCase();
  return INTENTS.find((intent) => intent.keywords.some((keyword) => normalized.includes(keyword))) ?? INTENTS[3]!;
}

export async function answerQuestion(workspaceId: string, question: string): Promise<AssistantAnswer> {
  const intent = detectIntent(question);
  const metrics = await computeHeadlineMetrics(workspaceId);
  const metric = metrics.find((m) => m.key === intent.key) ?? metrics[0]!;

  const [definition] = await db
    .select()
    .from(metricDefinitionsTable)
    .where(and(eq(metricDefinitionsTable.workspaceId, workspaceId), eq(metricDefinitionsTable.key, metric.key)))
    .limit(1);

  const months = trailingMonths(1);
  const currentMonth = months[0]!;

  const evidenceRows = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.workspaceId, workspaceId),
        gte(transactionsTable.occurredOn, currentMonth.start),
        lt(transactionsTable.occurredOn, currentMonth.end),
        intent.accounts.length === 1
          ? eq(transactionsTable.account, intent.accounts[0]!)
          : inArray(transactionsTable.account, intent.accounts),
      ),
    )
    .orderBy(desc(sql`abs(${transactionsTable.amountCents})`))
    .limit(5);

  const [{ count: sourceRows }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.workspaceId, workspaceId),
        gte(transactionsTable.occurredOn, currentMonth.start),
        lt(transactionsTable.occurredOn, currentMonth.end),
      ),
    );

  const direction = metric.delta >= 0 ? "up" : "down";
  const narrative =
    sourceRows === 0
      ? `There isn't any ledger data for ${currentMonth.label} yet, so I can't compute ${metric.label.toLowerCase()} for this period. Import transactions to get a real answer.`
      : `${metric.label} is ${metric.displayValue} for ${currentMonth.label}, ${direction} ${Math.abs(metric.delta)}${metric.key === "gross_margin" ? " pts" : "%"} vs. last month.`;

  const trend = intent.key === "revenue" || intent.key === "gross_margin" ? await computeRevenueTrend(workspaceId) : null;

  return {
    id: `answer-${Date.now()}`,
    question,
    headline: metric.displayValue,
    narrative,
    comparison: `${metric.delta >= 0 ? "+" : ""}${metric.delta}${metric.key === "gross_margin" ? " pts" : "%"} vs. last month`,
    confidence: sourceRows === 0 ? "low" : sourceRows < 5 ? "medium" : "high",
    chart: {
      type: "line",
      labels: trend ? trend.map((p) => p.label) : trailingMonths(12).map((m) => m.label),
      series: trend
        ? [{ name: "Revenue", values: trend.map((p) => p.revenue || p.forecast), color: null }]
        : [{ name: metric.label, values: metric.sparkline, color: null }],
    },
    evidence: evidenceRows.map((row) => ({
      id: row.id,
      date: row.occurredOn.toISOString().slice(0, 10),
      source: row.category,
      description: row.description,
      account: row.account,
      amount: row.amountCents / 100,
      status: "Posted",
    })),
    suggestedQuestions: [
      `Show the last 6 months of ${metric.label.toLowerCase()}.`,
      "What changed since last month?",
      "Which transactions had the biggest impact?",
    ],
    trace: {
      metric: metric.key,
      method: definition?.formula ?? "Computed from ledger transactions.",
      period: currentMonth.label,
      sourceRows,
    },
  };
}
