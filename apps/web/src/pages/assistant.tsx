import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Send, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/primitives";
import { MiniLineChart } from "@/components/charts";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAskAssistant, useConversations, useMessages } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import type { AssistantAnswer, Conversation } from "@/lib/api-types";

const STARTER_QUESTIONS = ["How has gross margin changed?", "What's our current burn rate?", "How much runway do we have?"];

function AnswerCard({ answer, onSuggested }: { answer: AssistantAnswer; onSuggested: (question: string) => void }) {
  const [showTrace, setShowTrace] = useState(false);
  const [showEvidence, setShowEvidence] = useState(true);
  const confidenceTone = answer.confidence === "high" ? "positive" : answer.confidence === "low" ? "negative" : "accent";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Answer</div>
            <h2 className="mt-2 max-w-2xl font-display text-[25px] leading-[1.2] tracking-[-.035em]">{answer.headline}</h2>
          </div>
          <Badge tone={confidenceTone}>{answer.confidence} confidence</Badge>
        </div>
        <p className="mt-5 max-w-3xl text-[14px] leading-7 text-foreground/80">{answer.narrative}</p>
        <div className="mt-4 flex items-start gap-2 rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
          <span>{answer.comparison}</span>
        </div>
      </div>

      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{answer.chart.series[0]?.name ?? "Trend"}</h3>
          <button onClick={() => setShowTrace(!showTrace)} className="focus-ring text-xs font-semibold text-primary hover:underline">
            {showTrace ? "Hide computation" : "Show computation"}
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <MiniLineChart labels={answer.chart.labels} values={answer.chart.series[0]?.values ?? []} />
        </div>
        {showTrace && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
            <div>
              <span className="label">Metric</span>
              <div className="mt-1 text-xs font-semibold">{answer.trace.metric}</div>
            </div>
            <div>
              <span className="label">Method</span>
              <div className="mt-1 text-xs font-semibold">{answer.trace.method}</div>
            </div>
            <div>
              <span className="label">Source rows</span>
              <div className="mt-1 tabular-nums text-xs font-semibold">{answer.trace.sourceRows.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <button onClick={() => setShowEvidence(!showEvidence)} className="focus-ring flex w-full items-center justify-between text-left">
          <span>
            <span className="label">Evidence trail</span>
            <span className="ml-2 text-xs text-muted-foreground">{answer.evidence.length} source rows</span>
          </span>
          {showEvidence ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {showEvidence &&
          (answer.evidence.length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">No transactions in scope for this period.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-mono text-[9px] uppercase tracking-[.08em] text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {answer.evidence.map((row) => (
                    <tr key={row.id} className="border-b border-border/70 last:border-0">
                      <td className="py-2.5 font-mono text-[10px] text-muted-foreground">{row.date}</td>
                      <td className="py-2.5">{row.source}</td>
                      <td className="max-w-[240px] truncate py-2.5 text-muted-foreground">{row.description}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        {row.amount < 0 ? "−" : ""}${Math.abs(row.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      {answer.suggestedQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-muted/50 p-4">
          <span className="mr-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
            <Zap size={12} /> Continue
          </span>
          {answer.suggestedQuestions.map((question) => (
            <button key={question} onClick={() => onSuggested(question)} className="focus-ring rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground hover:border-accent hover:text-foreground">
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationList({ conversations, activeId, onSelect, onCreate }: { conversations: Conversation[]; activeId?: string; onSelect: (id: string) => void; onCreate: () => void }) {
  return (
    <aside className="rounded-lg border border-border bg-card p-3 lg:w-[235px] lg:shrink-0">
      <div className="flex items-center justify-between px-2 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Threads</span>
        <button onClick={onCreate} className="focus-ring rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="New conversation">
          <Plus size={15} />
        </button>
      </div>
      <div className="mt-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="px-2 py-5 text-xs leading-5 text-muted-foreground">Start your first question.</div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn("focus-ring w-full rounded-md px-2.5 py-2.5 text-left transition", activeId === conversation.id ? "bg-secondary" : "hover:bg-muted")}
            >
              <div className="truncate text-xs font-semibold">{conversation.title}</div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export default function AssistantPage() {
  const { workspace } = useWorkspace();
  const [question, setQuestion] = useState("");
  const [selectedId, setSelectedId] = useState<string>();

  const conversationsQuery = useConversations(workspace?.id);
  const conversations = conversationsQuery.data ?? [];
  const activeId = selectedId ?? conversations[0]?.id;
  const messagesQuery = useMessages(activeId);
  const ask = useAskAssistant(workspace?.id);

  const messages = messagesQuery.data ?? [];
  const latestAnswer = ask.data?.answer;

  function submit(value = question) {
    if (!value.trim() || ask.isPending) return;
    ask.mutate({ conversationId: activeId, question: value.trim() }, { onSuccess: (data) => setSelectedId(data.conversationId) });
    setQuestion("");
  }

  return (
    <AppShell>
      <div className="animate-rise">
        <div className="mb-5">
          <div className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Assistant</div>
          <h1 className="mt-1 font-display text-3xl tracking-[-.04em]">What should we look into?</h1>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => setSelectedId(id)}
            onCreate={() => setSelectedId(undefined)}
          />

          <div className="min-w-0 flex-1">
            <div className="space-y-4">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[78%] rounded-lg rounded-br-sm bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">{message.content}</div>
                  </div>
                ) : message.answer ? (
                  <AnswerCard key={message.id} answer={message.answer} onSuggested={submit} />
                ) : (
                  <div key={message.id} className="rounded-lg border border-border bg-card p-4 text-sm">
                    {message.content}
                  </div>
                ),
              )}

              {ask.isPending && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-accent" /> Computing from your ledger…
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-3 w-4/5 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                </div>
              )}

              {latestAnswer && messages.length === 0 && <AnswerCard answer={latestAnswer} onSuggested={submit} />}

              {!latestAnswer && !messages.length && !ask.isPending && (
                <div className="ledger-grid rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-accent/50 bg-accent/13 text-primary">
                    <Sparkles size={21} />
                  </div>
                  <h2 className="mt-4 font-display text-2xl">A clear question beats a blank dashboard.</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Ask about revenue, margin, burn, or runway. The assistant computes the answer live from your ledger.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {STARTER_QUESTIONS.map((starter) => (
                      <button key={starter} onClick={() => submit(starter)} className="focus-ring rounded-full border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground hover:border-accent hover:text-foreground">
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="sticky bottom-4 mt-5 rounded-lg border border-border bg-card p-2 shadow-lg"
            >
              <div className="flex items-end gap-2">
                <textarea
                  aria-label="Ask a question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your business…"
                  rows={1}
                  className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button type="submit" disabled={!question.trim() || ask.isPending} className="size-10 shrink-0 px-0">
                  <Send size={16} />
                </Button>
              </div>
            </form>
            {ask.isError && <p className="mt-3 text-xs text-destructive">Couldn't complete that read. Try a narrower question.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
