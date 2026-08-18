import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, usersTable, workspacesTable, workspaceMembersTable, sessionsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { createSession, destroySession, hashSessionToken, SESSION_COOKIE_NAME } from "../lib/sessions";
import { requireAuth } from "../middlewares/require-auth";
import { seedMetricCatalog } from "../services/metric-catalog";

const router: IRouter = Router();

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  // Frontend and API live on different domains in production (e.g. Vercel +
  // Render), which makes every request cross-site. Cross-site cookies
  // require SameSite=None, and browsers require Secure alongside it.
  sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  workspaceName: z.string().trim().min(1, "Workspace name is required.").max(120),
});

router.post("/auth/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  const { name, email, password, workspaceName } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash }).returning();
  const [workspace] = await db.insert(workspacesTable).values({ name: workspaceName }).returning();
  await db.insert(workspaceMembersTable).values({ workspaceId: workspace!.id, userId: user!.id, role: "owner" });
  await seedMetricCatalog(workspace!.id);

  const { token, expiresAt } = await createSession(user!.id);
  res.cookie(SESSION_COOKIE_NAME, token, { ...SESSION_COOKIE_OPTIONS, expires: expiresAt });
  res.status(201).json({ user: { id: user!.id, name: user!.name, email: user!.email }, workspace });
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const passwordValid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordValid) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }

  const { token, expiresAt } = await createSession(user.id);
  res.cookie(SESSION_COOKIE_NAME, token, { ...SESSION_COOKIE_OPTIONS, expires: expiresAt });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/auth/logout", async (req, res) => {
  const token: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) await destroySession(token);
  res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  res.status(204).send();
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const memberships = await db
    .select({ workspace: workspacesTable, role: workspaceMembersTable.role })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(eq(workspaceMembersTable.userId, req.user!.id));

  res.json({
    user: { id: req.user!.id, name: req.user!.name, email: req.user!.email },
    workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })),
  });
});

router.get("/auth/sessions", requireAuth, async (req, res) => {
  const currentToken: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];
  const currentHash = currentToken ? hashSessionToken(currentToken) : null;

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, req.user!.id))
    .orderBy(desc(sessionsTable.createdAt));

  res.json(
    sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentHash,
    })),
  );
});

router.delete("/auth/sessions/:sessionId", requireAuth, async (req, res) => {
  const sessionId = String(req.params.sessionId);
  const currentToken: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];
  const currentHash = currentToken ? hashSessionToken(currentToken) : null;

  const [deleted] = await db
    .delete(sessionsTable)
    .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.userId, req.user!.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  if (sessionId === currentHash) {
    res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  }

  res.status(204).send();
});

export default router;
