import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";

export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden" | "suspended", message?: string) {
    super(message ?? code);
  }
}

/** For pages: redirect anonymous users to sign-in, preserving the return path. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  return user;
}

export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin" && user.role !== "moderator") redirect("/");
  return user;
}

/** For actions: throw typed errors instead of redirecting. */
export async function assertUser(opts: { allowSuspended?: boolean } = {}): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated", "يلزم تسجيل الدخول");
  if (user.status === "suspended" && !opts.allowSuspended)
    throw new AuthError("suspended", "حسابك موقوف مؤقتًا. تواصل مع الدعم لمعرفة التفاصيل.");
  return user;
}

export async function assertStaff(roles: ("admin" | "moderator")[] = ["admin", "moderator"]) {
  const user = await assertUser();
  if (!roles.includes(user.role as "admin" | "moderator")) throw new AuthError("forbidden", "لا تملك صلاحية لهذا الإجراء");
  return user;
}

export const isStaff = (u: CurrentUser | null) => u?.role === "admin" || u?.role === "moderator";
