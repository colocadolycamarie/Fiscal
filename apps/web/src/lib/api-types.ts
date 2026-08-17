export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

export interface Workspace {
  id: string;
  name: string;
  baseCurrency: string;
  role?: "owner" | "member";
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

export interface TrendPoint {
  label: string;
  revenue: number;
  grossProfit: number;
  forecast: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: "alert" | "sync" | "report";
}

export interface WorkspaceSummary {
  workspace: { id: string; name: string; baseCurrency: string; periodLabel: string };
  metrics: HeadlineMetric[];
  trend: TrendPoint[];
  activity: ActivityItem[];
}

export interface MetricDefinition {
  id: string;
  key: string;
  name: string;
  category: string;
  formula: string;
  owner: string;
  source: string;
  synonyms: string[];
  currentValue: string | null;
  sparkline?: number[];
}

export interface DataSource {
  id: string;
  workspaceId: string;
  provider: string;
  label: string;
  status: "connecting" | "syncing" | "ready" | "error";
  lastSyncAt: string | null;
  rowCount: number;
  errorMessage: string | null;
}

export interface Report {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  schedule: string;
  status: "draft" | "ready";
  recipients: number;
  snapshot: { metrics: HeadlineMetric[]; trend: TrendPoint[]; generatedAt: string } | null;
  lastGeneratedAt: string | null;
}

export interface AlertRule {
  id: string;
  workspaceId: string;
  metricKey: string;
  condition: "below" | "above" | "increases_by" | "decreases_by";
  thresholdValue: string;
  channel: string;
  active: boolean;
  lastTriggeredAt: string | null;
}

export interface AlertFiring {
  id: string;
  narrative: string;
  value: string;
  severity: "low" | "medium" | "high";
  firedAt: string;
  metricKey: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

export interface AssistantAnswer {
  id: string;
  question: string;
  headline: string;
  narrative: string;
  comparison: string;
  confidence: "high" | "medium" | "low";
  chart: { type: "line"; labels: string[]; series: { name: string; values: number[]; color: null }[] };
  evidence: { id: string; date: string; source: string; description: string; account: string; amount: number; status: string }[];
  suggestedQuestions: string[];
  trace: { metric: string; method: string; period: string; sourceRows: number };
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  confidence: string | null;
  answer: AssistantAnswer | null;
  createdAt: string;
}
