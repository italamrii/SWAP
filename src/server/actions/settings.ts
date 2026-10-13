"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroySession, SESSION_COOKIE } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { CITY_VALUES } from "@/lib/catalog/cities";
import { db } from "@/lib/db";
import { profiles, sessions, users } from "@/lib/db/schema";
import { isTrustedImageUrl } from "@/lib/validation/listing";
import { passwordSchema, usernameSchema } from "@/lib/validation/auth";
import { run, zodFail, type Result } from "./_utils";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "الاسم قصير جدًا").max(40, "الاسم طويل"),
  username: usernameSchema,
  city: z.enum(CITY_VALUES, { errorMap: () => ({ message: "اختر مدينتك" }) }),
  bio: z.string().trim().max(280, "النبذة أطول من 280 حرفًا").optional(),
  avatarUrl: z.string().refine(isTrustedImageUrl, "صورة غير صالحة").nullable().optional(),
});

export async function updateProfile(input: z.input<typeof profileSchema>): Promise<Result> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    const d = parsed.data;
    const [taken] = await db.select({ id: profiles.userId }).from(profiles).where(and(sql`lower(${profiles.username}) = lower(${d.username})`, ne(profiles.userId, user.id))).limit(1);
    if (taken) return { ok: false, error: "اسم المستخدم محجوز", fieldErrors: { username: ["اسم المستخدم محجوز، جرّب اسمًا آخر"] } };
    await db.update(profiles).set({ displayName: d.displayName, username: d.username, city: d.city, bio: d.bio || null, avatarUrl: d.avatarUrl ?? null }).where(eq(profiles.userId, user.id));
    revalidatePath("/", "layout");
    return { ok: true, message: "حفظنا ملفك الشخصي" };
  });
}

const privacySchema = z.object({
  phone: z.string().trim().regex(/^(05\d{8})?$/, "اكتب الرقم بصيغة 05XXXXXXXX").optional(),
  showPhone: z.boolean(),
  notifyEmail: z.boolean(),
});

export async function updatePrivacy(input: z.input<typeof privacySchema>): Promise<Result> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    const parsed = privacySchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    const d = parsed.data;
    if (d.showPhone && !d.phone) return { ok: false, error: "أضف رقم الجوال أولًا", fieldErrors: { phone: ["أضف رقم الجوال لإظهاره"] } };
    await db.update(profiles).set({ phone: d.phone || null, showPhone: d.showPhone, notifyEmail: d.notifyEmail }).where(eq(profiles.userId, user.id));
    return { ok: true, message: "حفظنا إعدادات الخصوصية" };
  });
}

export async function changePassword(input: { current: string; next: string }): Promise<Result> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    const parsed = z.object({ current: z.string().min(1, "أدخل كلمة المرور الحالية"), next: passwordSchema }).safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    const [u] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!(await verifyPassword(parsed.data.current, u.hash))) return { ok: false, error: "كلمة المرور الحالية غير صحيحة", fieldErrors: { current: ["كلمة المرور الحالية غير صحيحة"] } };
    await db.update(users).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(users.id, user.id));
    await signOutOtherSessionsFor(user.id);
    return { ok: true, message: "تم تغيير كلمة المرور وتسجيل خروجك من الأجهزة الأخرى" };
  });
}

async function signOutOtherSessionsFor(userId: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const current = token ? hashToken(token) : "";
  await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, current)));
}

export async function signOutOtherSessions(): Promise<Result> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    await signOutOtherSessionsFor(user.id);
    return { ok: true, message: "سجّلنا خروجك من كل الأجهزة الأخرى" };
  });
}

export async function deleteAccount(input: { confirmEmail: string; password: string }): Promise<Result> {
  const res = await run(async () => {
    const user = await assertUser({ allowSuspended: true });
    if (input.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { ok: false, error: "البريد غير مطابق" };
    const [u] = await db.select({ hash: users.passwordHash, role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
    if (u.role === "admin") return { ok: false, error: "لا يمكن حذف حساب مدير من هنا" };
    if (!(await verifyPassword(input.password, u.hash))) return { ok: false, error: "كلمة المرور غير صحيحة" };
    await destroySession();
    await db.delete(users).where(eq(users.id, user.id));
    return { ok: true };
  });
  if (res.ok) redirect("/?deleted=1");
  return res;
}
