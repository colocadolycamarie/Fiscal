import type { NextFunction, Request, Response } from "express";
import { db, workspaceMembersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
    }
  }
}

/** Reads workspaceId from the route params, query string, or JSON body and verifies req.user is a member. */
export async function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction) {
  const workspaceId = (req.params.workspaceId ?? req.query.workspaceId ?? req.body?.workspaceId) as string | undefined;

  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required." });
    return;
  }

  const [membership] = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, req.user!.id)))
    .limit(1);

  if (!membership) {
    res.status(403).json({ error: "You do not have access to this workspace." });
    return;
  }

  req.workspaceId = workspaceId;
  next();
}
