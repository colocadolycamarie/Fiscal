import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, conversationsTable, messagesTable, workspaceMembersTable } from "@workspace/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth";
import { requireWorkspaceAccess } from "../middlewares/require-workspace-access";
import { answerQuestion } from "../services/assistant";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/conversations", requireWorkspaceAccess, async (req, res) => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.workspaceId, req.workspaceId!))
    .orderBy(desc(conversationsTable.updatedAt));
  res.json(conversations);
});

const createConversationSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
});

router.post("/conversations", requireWorkspaceAccess, async (req, res) => {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  const [conversation] = await db
    .insert(conversationsTable)
    .values({ workspaceId: req.workspaceId!, title: parsed.data.title })
    .returning();
  res.status(201).json(conversation);
});

router.get("/conversations/:conversationId/messages", async (req, res) => {
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, String(req.params.conversationId)))
    .orderBy(asc(messagesTable.createdAt));
  res.json(messages);
});

const askSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  question: z.string().trim().min(1, "Ask a question.").max(500),
});

router.post("/chat", requireWorkspaceAccess, async (req, res) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  const { conversationId: providedConversationId, question } = parsed.data;

  let conversationId = providedConversationId;
  if (!conversationId) {
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ workspaceId: req.workspaceId!, title: question.slice(0, 80) })
      .returning();
    conversationId = conversation!.id;
  } else {
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(and(eq(conversationsTable.id, conversationId), eq(conversationsTable.workspaceId, req.workspaceId!)))
      .limit(1);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
  }

  const answer = await answerQuestion(req.workspaceId!, question);

  await db.insert(messagesTable).values([
    { conversationId, role: "user", content: question },
    { conversationId, role: "assistant", content: answer.narrative, confidence: answer.confidence, answer },
  ]);
  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));

  res.json({ conversationId, answer });
});

export default router;
