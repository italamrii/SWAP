import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";

export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden" | "suspended" | "phone_required", message?: string) {
    super(message ?? code);
  }
}

/** For pages: redirect anonymous users to sign-in, preserving the return path. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  return user;
}

export const PHONE_REQUIRED_MESSAGE = "وثّق رقم جوالك السعودي أولًا لتتمكن من النشر والمراسلة وتقديم العروض.";

export const verifyPhoneHref = (returnTo?: string) => `/account/verify-phone${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`;

/** For pages that perform marketplace actions: anonymous → sign-in, unverified → verify phone. */
export async function requireEligible(returnTo?: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!user.phoneVerified) redirect(verifyPhoneHref(returnTo));
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

/** For marketplace actions: a verified Saudi mobile number is the eligibility rule (server-enforced). */
export async function assertEligible(): Promise<CurrentUser> {
  const user = await assertUser();
  if (!user.phoneVerified) throw new AuthError("phone_required", PHONE_REQUIRED_MESSAGE);
  return user;
}

export async function assertStaff(roles: ("admin" | "moderator")[] = ["admin", "moderator"]) {
  const user = await assertUser();
  if (!roles.includes(user.role as "admin" | "moderator")) throw new AuthError("forbidden", "لا تملك صلاحية لهذا الإجراء");
  return user;
}

export const isStaff = (u: CurrentUser | null) => u?.role === "admin" || u?.role === "moderator";
