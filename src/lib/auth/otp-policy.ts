/**
 * SMS code policy. Pure functions: every limit and decision here is covered by unit tests.
 * Limits are generous per IP because Saudi carriers put many customers behind one CGNAT address.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP = {
  length: 6,
  ttlSeconds: 5 * 60,
  maxAttempts: 5,
  /** First resend after 60s, then doubling (120s, 240s…) within the hour, capped at 10 minutes. */
  baseCooldownSeconds: 60,
  maxCooldownSeconds: 10 * 60,
  perPhoneHour: 5,
  perPhoneDay: 10,
  perIpHour: 30,
  perIpDay: 100,
  /** A number whose codes were exhausted (wrong guesses) this many times in an hour is locked for an hour. */
  lockAfterExhausted: 3,
  lockSeconds: 60 * 60,
} as const;

export function generateCode(): string {
  return String(randomInt(0, 10 ** OTP.length)).padStart(OTP.length, "0");
}

const DEV_SECRET = "swap-dev-only-otp-secret--never-used-in-production";

export function otpSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.OTP_SECRET ?? "";
  if (s.length >= 32) return s;
  if (env.NODE_ENV === "production") throw new Error("OTP_SECRET (32+ chars) must be set in production");
  return DEV_SECRET;
}

/** Bound to the challenge id so a hash can't be replayed against another challenge. */
export function hashCode(secret: string, challengeId: string, code: string) {
  return createHmac("sha256", secret).update(`otp:${challengeId}:${code}`).digest("hex");
}

export function hashIp(secret: string, ip: string) {
  return createHmac("sha256", secret).update(`ip:${ip}`).digest("hex").slice(0, 32);
}

export function codeMatches(storedHash: string, secret: string, challengeId: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const a = Buffer.from(storedHash, "hex");
  const b = Buffer.from(hashCode(secret, challengeId, code), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type SendStats = {
  /** Most recent send to this number (any purpose), if any. */
  lastSentAt: Date | null;
  phoneHour: number;
  phoneDay: number;
  ipHour: number;
  ipDay: number;
  /** Codes for this number exhausted by wrong guesses in the last hour, and when the latest happened. */
  exhaustedHour: number;
  lastExhaustedAt: Date | null;
  globalToday: number;
};

export type SendDecision = { ok: true } | { ok: false; reason: "cooldown" | "phone_limit" | "ip_limit" | "locked" | "global_cap"; retryAfter: number };

export function cooldownSeconds(phoneHour: number) {
  if (phoneHour <= 0) return 0;
  return Math.min(OTP.baseCooldownSeconds * 2 ** (phoneHour - 1), OTP.maxCooldownSeconds);
}

export function sendDecision(s: SendStats, cap: number, now = new Date()): SendDecision {
  const secsSince = (d: Date) => Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s.globalToday >= cap) return { ok: false, reason: "global_cap", retryAfter: 3600 };
  if (s.exhaustedHour >= OTP.lockAfterExhausted && s.lastExhaustedAt) {
    const left = OTP.lockSeconds - secsSince(s.lastExhaustedAt);
    if (left > 0) return { ok: false, reason: "locked", retryAfter: left };
  }
  if (s.ipHour >= OTP.perIpHour || s.ipDay >= OTP.perIpDay) return { ok: false, reason: "ip_limit", retryAfter: s.ipHour >= OTP.perIpHour ? 3600 : 86400 };
  if (s.phoneDay >= OTP.perPhoneDay) return { ok: false, reason: "phone_limit", retryAfter: 86400 };
  if (s.phoneHour >= OTP.perPhoneHour) return { ok: false, reason: "phone_limit", retryAfter: 3600 };
  if (s.lastSentAt) {
    const left = cooldownSeconds(s.phoneHour) - secsSince(s.lastSentAt);
    if (left > 0) return { ok: false, reason: "cooldown", retryAfter: left };
  }
  return { ok: true };
}

/** Seconds until the next resend is allowed, after a send that brings the hourly count to `phoneHourAfter`. */
export const nextResendIn = (phoneHourAfter: number) => cooldownSeconds(phoneHourAfter);

export const SEND_ERRORS: Record<Exclude<SendDecision, { ok: true }>["reason"] | "send_failed" | "unavailable", string> = {
  cooldown: "انتظر قليلًا قبل طلب رمز جديد.",
  phone_limit: "طلبت رموزًا كثيرة لهذا الرقم. حاول لاحقًا.",
  ip_limit: "طلبات كثيرة من شبكتك. حاول لاحقًا.",
  locked: "أوقفنا إرسال الرموز لهذا الرقم مؤقتًا بعد محاولات خاطئة متكررة. حاول بعد ساعة.",
  global_cap: "خدمة الرسائل مشغولة حاليًا. حاول بعد قليل.",
  send_failed: "تعذّر إرسال الرسالة. تأكد من الرقم وحاول مرة أخرى بعد قليل.",
  unavailable: "التحقق برقم الجوال غير متاح حاليًا.",
};

export function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds} ثانية`;
  const m = Math.ceil(seconds / 60);
  return m < 60 ? `${m} دقيقة` : `${Math.ceil(m / 60)} ساعة`;
}
