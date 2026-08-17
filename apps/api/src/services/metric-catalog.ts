import { db, metricDefinitionsTable, type NewMetricDefinition } from "@workspace/db";

/**
 * The standard finance metric catalog every workspace starts with. This
 * documents what each metric *means* (formula, owner, source); the value
 * itself is always computed live by services/metrics.ts.
 */
const STANDARD_METRICS: Omit<NewMetricDefinition, "workspaceId">[] = [
  {
    key: "revenue",
    name: "Revenue",
    category: "Income statement",
    formula: "Sum of ledger rows on the revenue account for the period",
    owner: "Finance",
    source: "Ledger import",
    synonyms: ["sales", "top line", "bookings"],
  },
  {
    key: "cogs",
    name: "Cost of goods sold",
    category: "Income statement",
    formula: "Sum of ledger rows on the cogs account for the period",
    owner: "Finance",
    source: "Ledger import",
    synonyms: ["cost of revenue", "direct costs"],
  },
  {
    key: "gross_margin",
    name: "Gross margin",
    category: "Profitability",
    formula: "(Revenue − COGS) ÷ Revenue",
    owner: "FP&A",
    source: "Computed",
    synonyms: ["GM", "gross profit margin"],
  },
  {
    key: "burn_rate",
    name: "Net burn rate",
    category: "Cash & runway",
    formula: "(COGS + Opex) − Revenue for the period",
    owner: "Finance",
    source: "Computed",
    synonyms: ["burn", "monthly burn", "cash burn"],
  },
  {
    key: "runway",
    name: "Runway",
    category: "Cash & runway",
    formula: "Cash balance ÷ trailing 3-month average net burn",
    owner: "Finance",
    source: "Computed",
    synonyms: ["cash runway", "months of cash"],
  },
];

export async function seedMetricCatalog(workspaceId: string): Promise<void> {
  await db.insert(metricDefinitionsTable).values(STANDARD_METRICS.map((metric) => ({ ...metric, workspaceId })));
}
