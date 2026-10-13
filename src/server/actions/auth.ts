"use server";

import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions, destroySession, getCurrentUser } from "@/lib/auth/session";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { CITY_VALUES } from "@/lib/catalog/cities";
import { db } from "@/lib/db";
import { passwordResetTokens, profiles, users } from "@/lib/db/schema";
import { APP_URL } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { demoAccountsBlocked, isDemoEmail } from "@/lib/demo";
import { safeNext } from "@/lib/safe-next";
import { emailSchema, passwordSchema, usernameSchema } from "@/lib/validation/auth";

export type FormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined>; message?: string; values?: Record<string, string> };

const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "الاسم قصير جدًا").max(40, "الاسم طويل"),
  email: emailSchema,
  password: passwordSchema,
  terms: z.literal("on", { errorMap: () => ({ message: "يلزم الموافقة على الشروط وسياسة الخصوصية" }) }),
});

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const values = { displayName: raw.displayName ?? "", email: raw.email ?? "" };
  if (!(await rateLimit(`signup:${values.email}`, 5, 3600))) return { error: "محاولات كثيرة، حاول بعد قليل.", values };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  const { displayName, email, password } = parsed.data;
  if (isDemoEmail(email)) return { fieldErrors: { email: ["هذا النطاق مخصص لحسابات العرض"] }, values };

  const [exists] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (exists) return { fieldErrors: { email: ["هذا البريد مسجّل مسبقًا. جرّب تسجيل الدخول."] }, values };

  const passwordHash = await hashPassword(password);
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 16) || "user";
  const userId = await db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({ email, passwordHash }).returning({ id: users.id });
    let username = base.length >= 3 ? base : `${base}_swap`;
    for (let i = 0; i < 5; i++) {
      const [taken] = await tx.select({ u: profiles.username }).from(profiles).where(sql`lower(${profiles.username}) = ${username}`).limit(1);
      if (!taken) break;
      username = `${base}${Math.floor(100 + Math.random() * 900)}`;
    }
    await tx.insert(profiles).values({ userId: u.id, username, displayName });
    return u.id;
  });
  await createSession(userId);
  redirect("/onboarding");
}

const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, "أدخل كلمة المرور") });

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const values = { email: raw.email ?? "" };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  const { email, password } = parsed.data;
  if (isDemoEmail(email) && demoAccountsBlocked()) return { error: "حسابات العرض معطّلة في بيئة الإنتاج.", values };
  if (!(await rateLimit(`signin:${email}`, 10, 900))) return { error: "محاولات دخول كثيرة. انتظر 15 دقيقة ثم حاول مجددًا.", values };

  const [u] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  // Constant-ish time: always run a hash verification.
  const valid = u ? await verifyPassword(password, u.passwordHash) : (await hashPassword(password), false);
  if (!u || !valid) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة", values };
  if (u.status === "banned") return { error: "هذا الحساب محظور لمخالفته شروط الاستخدام.", values };

  await createSession(u.id);
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, u.id));
  redirect(safeNext(raw.next, "/account"));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { fieldErrors: { email: parsed.error.flatten().formErrors } };
  const email = parsed.data;
  const done: FormState = { ok: true, message: "إذا كان البريد مسجّلًا لدينا، ستصلك رسالة فيها رابط إعادة التعيين خلال دقائق." };
  if (!(await rateLimit(`reset:${email}`, 3, 3600))) return done;

  const [u] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (u) {
    const token = newToken();
    await db.insert(passwordResetTokens).values({ id: hashToken(token), userId: u.id, expiresAt: new Date(Date.now() + 30 * 60_000) });
    const link = `${APP_URL}/reset-password?token=${token}`;
    // Email provider integration point (Resend/SES). In development the link is logged.
    if (process.env.NODE_ENV !== "production") console.info(`[password-reset] ${email} → ${link}`);
  }
  return done;
}

const resetSchema = z.object({ token: z.string().min(20), password: passwordSchema, confirm: z.string() }).refine((d) => d.password === d.confirm, {
  path: ["confirm"],
  message: "كلمتا المرور غير متطابقتين",
});

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const id = hashToken(parsed.data.token);
  const [t] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.id, id), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  if (!t) return { error: "رابط إعادة التعيين غير صالح أو منتهي. اطلب رابطًا جديدًا." };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(users.id, t.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  await destroyAllSessions(t.userId);
  await createSession(t.userId);
  redirect("/account?reset=1");
}

const onboardingSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(2, "الاسم قصير جدًا").max(40),
  city: z.enum(CITY_VALUES, { errorMap: () => ({ message: "اختر مدينتك" }) }),
  bio: z.string().trim().max(280, "النبذة أطول من 280 حرفًا").optional(),
});

export async function completeOnboarding(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  const { username, displayName, city, bio } = parsed.data;
  const [taken] = await db
    .select({ id: profiles.userId })
    .from(profiles)
    .where(and(sql`lower(${profiles.username}) = lower(${username})`, sql`${profiles.userId} <> ${user.id}`))
    .limit(1);
  if (taken) return { fieldErrors: { username: ["اسم المستخدم محجوز، جرّب اسمًا آخر"] }, values: raw };
  await db.update(profiles).set({ username, displayName, city, bio: bio || null, onboardedAt: new Date() }).where(eq(profiles.userId, user.id));
  redirect(safeNext(raw.next, "/account?welcome=1"));
}
