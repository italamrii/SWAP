import "server-only";
import { timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { codeMatches, generateCode, hashCode, hashIp, nextResendIn, OTP, otpSecret, sendDecision, type SendDecision } from "@/lib/auth/otp-policy";
import { db } from "@/lib/db";
import { phoneOtps } from "@/lib/db/schema";
import { APP_URL } from "@/lib/env";
import { smsAvailability, smsDailyCap } from "@/lib/sms/config";
import { sendSms } from "@/lib/sms/send";

export type Purpose = "login" | "change" | "claim";

export async function clientIpHash() {
  const h = await headers();
  // Vercel and most proxies put the client first; fall back to the platform header.
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return hashIp(otpSecret(), ip);
}

async function sendStats(phone: string, ipHash: string) {
  const [r] = await db.execute<{
    last_sent_at: Date | null; phone_hour: number; phone_day: number; ip_hour: number; ip_day: number; exhausted_hour: number; last_exhausted_at: Date | null; global_today: number;
  }>(sql`
    select
      (select max(created_at) from phone_otps where phone = ${phone} and purpose <> 'claim') as last_sent_at,
      (select count(*)::int from phone_otps where phone = ${phone} and purpose <> 'claim' and created_at > now() - interval '1 hour') as phone_hour,
      (select count(*)::int from phone_otps where phone = ${phone} and purpose <> 'claim' and created_at > now() - interval '1 day') as phone_day,
      (select count(*)::int from phone_otps where ip_hash = ${ipHash} and purpose <> 'claim' and created_at > now() - interval '1 hour') as ip_hour,
      (select count(*)::int from phone_otps where ip_hash = ${ipHash} and purpose <> 'claim' and created_at > now() - interval '1 day') as ip_day,
      (select count(*)::int from phone_otps where phone = ${phone} and attempts >= max_attempts and created_at > now() - interval '1 hour') as exhausted_hour,
      (select max(created_at) from phone_otps where phone = ${phone} and attempts >= max_attempts and created_at > now() - interval '1 hour') as last_exhausted_at,
      (select count(*)::int from phone_otps where purpose <> 'claim' and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc') as global_today
  `);
  const d = (v: Date | string | null) => (v ? new Date(v) : null);
  return {
    lastSentAt: d(r.last_sent_at), phoneHour: r.phone_hour, phoneDay: r.phone_day, ipHour: r.ip_hour, ipDay: r.ip_day,
    exhaustedHour: r.exhausted_hour, lastExhaustedAt: d(r.last_exhausted_at), globalToday: r.global_today,
  };
}

function smsBody(code: string) {
  const host = new URL(APP_URL).hostname;
  // The last line lets Android/iOS offer the code for autofill on our domain only (WebOTP).
  const bound = host === "localhost" || host === "127.0.0.1" ? "" : `\n\n@${host} #${code}`;
  return `رمز التحقق في سواب: ${code}\nلا تشاركه مع أي أحد — فريق سواب لن يطلبه منك. صالح 5 دقائق.${bound}`;
}

export type IssueResult =
  | { ok: true; challengeId: string; resendIn: number }
  | { ok: false; reason: Exclude<SendDecision, { ok: true }>["reason"] | "unavailable" | "send_failed"; retryAfter?: number };

/** Create a challenge and text the code. The code exists in memory only for the duration of this call. */
export async function issueOtp(input: { phone: string; purpose: Exclude<Purpose, "claim">; userId?: string }): Promise<IssueResult> {
  if (!smsAvailability().available) return { ok: false, reason: "unavailable" };
  const secret = otpSecret();
  const ipHash = await clientIpHash();
  const stats = await sendStats(input.phone, ipHash);
  const decision = sendDecision(stats, smsDailyCap());
  if (!decision.ok) return { ok: false, reason: decision.reason, retryAfter: decision.retryAfter };

  // A new code replaces any earlier unused code for the same number and purpose.
  await db.update(phoneOtps).set({ consumedAt: new Date() }).where(and(eq(phoneOtps.phone, input.phone), eq(phoneOtps.purpose, input.purpose), isNull(phoneOtps.consumedAt)));

  const id = crypto.randomUUID();
  const code = generateCode();
  await db.insert(phoneOtps).values({
    id, phone: input.phone, purpose: input.purpose, userId: input.userId ?? null, codeHash: hashCode(secret, id, code),
    maxAttempts: OTP.maxAttempts, ipHash, expiresAt: new Date(Date.now() + OTP.ttlSeconds * 1000),
  });
  const sent = await sendSms(input.phone, smsBody(code));
  if (!sent.ok) {
    await db.update(phoneOtps).set({ consumedAt: new Date() }).where(eq(phoneOtps.id, id));
    return { ok: false, reason: "send_failed" };
  }
  await db.update(phoneOtps).set({ delivered: true }).where(eq(phoneOtps.id, id));
  // Opportunistic retention: challenge rows are only needed for rate limiting (≤ 1 day) plus a short audit window.
  if (Math.random() < 0.02) await db.delete(phoneOtps).where(lt(phoneOtps.createdAt, new Date(Date.now() - 30 * 864e5)));
  return { ok: true, challengeId: id, resendIn: nextResendIn(stats.phoneHour + 1) };
}

export type VerifyResult =
  | { ok: true; phone: string; userId: string | null }
  | { ok: false; reason: "invalid" | "expired" | "exhausted"; attemptsLeft?: number };

/** Single use, constant-time comparison, attempts counted atomically before comparing. */
export async function verifyOtp(challengeId: string, code: string, purpose: Purpose): Promise<VerifyResult> {
  if (!/^[0-9a-f-]{36}$/.test(challengeId)) return { ok: false, reason: "expired" };
  const [row] = await db
    .update(phoneOtps)
    .set({ attempts: sql`${phoneOtps.attempts} + 1` })
    .where(and(eq(phoneOtps.id, challengeId), eq(phoneOtps.purpose, purpose), isNull(phoneOtps.consumedAt), gt(phoneOtps.expiresAt, new Date()), sql`${phoneOtps.attempts} < ${phoneOtps.maxAttempts}`))
    .returning();
  if (!row) {
    const [existing] = await db.select({ attempts: phoneOtps.attempts, max: phoneOtps.maxAttempts }).from(phoneOtps).where(eq(phoneOtps.id, challengeId)).limit(1);
    return { ok: false, reason: existing && existing.attempts >= existing.max ? "exhausted" : "expired" };
  }
  if (!codeMatches(row.codeHash, otpSecret(), row.id, code.trim())) {
    const left = row.maxAttempts - row.attempts;
    return left > 0 ? { ok: false, reason: "invalid", attemptsLeft: left } : { ok: false, reason: "exhausted" };
  }
  const [consumed] = await db.update(phoneOtps).set({ consumedAt: new Date() }).where(and(eq(phoneOtps.id, row.id), isNull(phoneOtps.consumedAt))).returning({ id: phoneOtps.id });
  if (!consumed) return { ok: false, reason: "expired" };
  return { ok: true, phone: row.phone, userId: row.userId };
}

/** Short-lived, single-use server-side ticket proving a number was just verified (used by the number-recycling choice). */
export async function issueClaimTicket(phone: string) {
  const id = crypto.randomUUID();
  const token = generateCode() + generateCode();
  await db.insert(phoneOtps).values({ id, phone, purpose: "claim", codeHash: hashCode(otpSecret(), id, token), maxAttempts: 1, delivered: true, expiresAt: new Date(Date.now() + 10 * 60_000) });
  return `${id}.${token}`;
}

export async function redeemClaimTicket(ticket: string): Promise<string | null> {
  const [id, token] = ticket.split(".");
  if (!id || !token || !/^[0-9a-f-]{36}$/.test(id) || !/^\d{12}$/.test(token)) return null;
  const [row] = await db
    .update(phoneOtps)
    .set({ consumedAt: new Date(), attempts: 1 })
    .where(and(eq(phoneOtps.id, id), eq(phoneOtps.purpose, "claim"), isNull(phoneOtps.consumedAt), gt(phoneOtps.expiresAt, new Date())))
    .returning();
  if (!row) return null;
  const expected = Buffer.from(row.codeHash, "hex");
  const actual = Buffer.from(hashCode(otpSecret(), id, token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? row.phone : null;
}
