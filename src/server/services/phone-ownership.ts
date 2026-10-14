import "server-only";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { isDormant } from "@/lib/auth/eligibility";
import { destroyAllSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { adminAuditLogs, listings, profiles, users } from "@/lib/db/schema";
import { demoAccountsBlocked, isDemoEmail } from "@/lib/demo";
import { maskPhone } from "@/lib/phone";
import { smsAvailability } from "@/lib/sms/config";
import { shortId } from "@/lib/slug";
import { notify } from "../notify";

export type Holder = { id: string; email: string | null; status: "active" | "suspended" | "banned"; lastActiveAt: Date };

export async function findHolder(phone: string): Promise<Holder | null> {
  const [u] = await db
    .select({ id: users.id, email: users.email, status: users.status, lastSeenAt: users.lastSeenAt, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  return u ? { id: u.id, email: u.email, status: u.status, lastActiveAt: u.lastSeenAt ?? u.createdAt } : null;
}

/**
 * Fictional seed accounts carry real-format numbers. Never text them through a paid provider,
 * and never accept them where demo accounts are disabled (public production).
 */
export function demoNumberBlocked(holder: Holder | null) {
  if (!holder?.email || !isDemoEmail(holder.email)) return false;
  if (demoAccountsBlocked()) return true;
  const a = smsAvailability();
  return !(a.available && a.provider === "outbox");
}

export type Classification = { kind: "new" } | { kind: "existing"; holder: Holder } | { kind: "dormant"; holder: Holder } | { kind: "banned" };

/** What a successful code for this number means. Dormant numbers may have been recycled by the carrier. */
export function classify(holder: Holder | null): Classification {
  if (!holder) return { kind: "new" };
  if (holder.status === "banned") return { kind: "banned" };
  if (isDormant(holder.lastActiveAt)) return { kind: "dormant", holder };
  return { kind: "existing", holder };
}

async function audit(actorId: string | null, action: string, targetId: string, meta: Record<string, unknown>) {
  await db.insert(adminAuditLogs).values({ actorId, action, targetType: "user", targetId, meta });
}

/** Create a phone-only account. Called only after the code for `phone` was verified. */
export async function createPhoneAccount(phone: string): Promise<string> {
  return db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({ phone, phoneVerifiedAt: new Date(), lastSeenAt: new Date() }).returning({ id: users.id });
    let username = `user_${shortId(6).toLowerCase()}`;
    for (let i = 0; i < 5; i++) {
      const [taken] = await tx.select({ u: profiles.username }).from(profiles).where(sql`lower(${profiles.username}) = ${username}`).limit(1);
      if (!taken) break;
      username = `user_${shortId(7).toLowerCase()}`;
    }
    await tx.insert(profiles).values({ userId: u.id, username, displayName: "عضو سواب" });
    await tx.insert(adminAuditLogs).values({ actorId: u.id, action: "account.create_phone", targetType: "user", targetId: u.id, meta: { phone: maskPhone(phone) } });
    return u.id;
  });
}

/**
 * Number recycling: detach a dormant account from its number so the new owner can use it.
 * The old account keeps all its data but loses marketplace eligibility, its sessions end and
 * its active listings are hidden until its owner verifies a new number.
 */
export async function releaseNumber(fromUserId: string, phone: string, toUserId: string | null) {
  await db
    .update(users)
    .set({ phone: null, phoneVerifiedAt: null, phoneReleasedAt: new Date() })
    .where(and(eq(users.id, fromUserId), or(eq(users.phone, phone), isNull(users.phone))));
  await db
    .update(listings)
    .set({ status: "hidden", moderationNote: "أُخفي تلقائيًا: رقم الجوال المرتبط بالحساب انتقل لمالك جديد. وثّق رقمك الحالي لإعادة إظهاره." })
    .where(and(eq(listings.sellerId, fromUserId), inArray(listings.status, ["active", "pending_review"])));
  await destroyAllSessions(fromUserId);
  await audit(toUserId, "phone.released", fromUserId, { phone: maskPhone(phone), reason: "dormant_number_reclaimed" });
  await notify(fromUserId, {
    type: "system",
    title: "فُصل رقم الجوال عن حسابك",
    body: "تحقق مالك جديد من رقم الجوال المرتبط بحسابك غير النشط. بياناتك محفوظة؛ وثّق رقمك الحالي لاستعادة كامل المزايا.",
    href: "/account/verify-phone",
  });
}

export async function recordPhoneChange(userId: string, from: string | null, to: string) {
  await audit(userId, from ? "phone.change" : "phone.verify", userId, { from: from ? maskPhone(from) : null, to: maskPhone(to) });
  await notify(userId, {
    type: "system",
    title: from ? "تم تغيير رقم جوالك" : "تم توثيق رقم جوالك",
    body: `الرقم الموثّق الآن ينتهي بـ ${to.slice(-4)}. إذا لم تقم بهذا التغيير تواصل مع الدعم فورًا.`,
    href: "/account/settings",
  });
}

export const isUniqueViolation = (e: unknown) => !!e && typeof e === "object" && "code" in e && (e as { code: string }).code === "23505";
