import type { NextFunction, Request, Response } from "express";
import type { User } from "@workspace/db";
import { SESSION_COOKIE_NAME, getUserForSessionToken } from "../lib/sessions";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const user = await getUserForSessionToken(token);
  if (!user) {
    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return;
  }

  req.user = user;
  next();
}
