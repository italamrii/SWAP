import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { profiles, sessions, users } from "@/lib/db/schema";
import { hashToken, newToken } from "./tokens";

export const SESSION_COOKIE = "swap_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  const ua = (await headers()).get("user-agent")?.slice(0, 255) ?? null;
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, userAgent: ua });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  // Opportunistic cleanup of this user's expired sessions.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export type CurrentUser = {
  id: string;
  email: string;
  role: "user" | "moderator" | "admin";
  status: "active" | "suspended" | "banned";
  trusted: boolean;
  createdAt: Date;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  onboarded: boolean;
};

/** Memoized per request. Returns null for anonymous or banned users. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = hashToken(token);
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      trusted: users.trusted,
      createdAt: users.createdAt,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      city: profiles.city,
      onboardedAt: profiles.onboardedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.status === "banned") return null;

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    trusted: row.trusted,
    createdAt: row.createdAt,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    city: row.city,
    onboarded: Boolean(row.onboardedAt),
  };
});
