"use server";

import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assertUser } from "@/lib/auth/guards";
import { formatWait, OTP, SEND_ERRORS } from "@/lib/auth/otp-policy";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { profiles, sessions, users } from "@/lib/db/schema";
import { formatLocal, maskPhone, normalizeSaudiMobile, phoneProblem } from "@/lib/phone";
import { isVisualPreview } from "@/lib/preview-mode";
import { safeNext } from "@/lib/safe-next";
import { issueClaimTicket, issueOtp, redeemClaimTicket, verifyOtp, type IssueResult } from "../services/otp";
import { classify, createPhoneAccount, demoNumberBlocked, findHolder, isUniqueViolation, recordPhoneChange, releaseNumber } from "../services/phone-ownership";

export type PhoneFlowState = {
  step: "phone" | "code" | "recycled";
  /** The visitor's own number in local format, echoed back so they can edit or resend. */
  phone?: string;
  masked?: string;
  resendIn?: number;
  error?: string;
  fieldError?: string;
  message?: string;
  /** Changes on every response so the client can restart timers. */
  nonce?: number;
};

const LOGIN_COOKIE = "swap_otp";
const CHANGE_COOKIE = "swap_otp_change";
const CLAIM_COOKIE = "swap_claim";

async function setFlowCookie(name: string, value: string, maxAge: number) {
  (await cookies()).set(name, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
}

function sendError(r: Exclude<IssueResult, { ok: true }>) {
  const base = SEND_ERRORS[r.reason];
  return r.retryAfter && r.reason !== "unavailable" ? `${base} (بعد ${formatWait(r.retryAfter)})` : base;
}

const unavailable = (phone?: string): PhoneFlowState => ({ step: "phone", phone, error: SEND_ERRORS.unavailable });

/* ───────────── Sign in / sign up (one flow: a verified number either opens its account or creates one) ───────────── */

export async function phoneAuth(prev: PhoneFlowState, form: FormData): Promise<PhoneFlowState> {
  return { ...(await phoneAuthStep(prev, form)), nonce: Date.now() };
}

async function phoneAuthStep(prev: PhoneFlowState, form: FormData): Promise<PhoneFlowState> {
  if (isVisualPreview()) return unavailable();
  const intent = String(form.get("intent") ?? "send");
  const next = String(form.get("next") ?? "");

  if (intent === "edit") return { step: "phone", phone: prev.phone };

  if (intent === "send") {
    const raw = String(form.get("phone") ?? prev.phone ?? "");
    const phone = normalizeSaudiMobile(raw);
    if (!phone) return { step: "phone", phone: raw, fieldError: phoneProblem(raw) };
    const holder = await findHolder(phone);
    if (demoNumberBlocked(holder)) return { step: "phone", phone: raw, fieldError: "هذا الرقم مخصص لحسابات العرض ولا يمكن استخدامه هنا." };
    const r = await issueOtp({ phone, purpose: "login" });
    if (!r.ok) {
      // Cooldown while already on the code step keeps the user there.
      if (r.reason === "cooldown" && prev.step === "code") return { ...prev, error: sendError(r), resendIn: r.retryAfter };
      return r.reason === "unavailable" ? unavailable(raw) : { step: prev.step === "code" ? "code" : "phone", phone: formatLocal(phone), masked: maskPhone(phone), error: sendError(r), resendIn: r.retryAfter };
    }
    await setFlowCookie(LOGIN_COOKIE, r.challengeId, OTP.ttlSeconds + 60);
    return { step: "code", phone: formatLocal(phone), masked: maskPhone(phone), resendIn: r.resendIn, message: prev.step === "code" ? "أرسلنا رمزًا جديدًا." : undefined };
  }

  if (intent === "verify") {
    const code = String(form.get("code") ?? "").replace(/\D/g, "");
    if (code.length !== OTP.length) return { ...prev, step: "code", error: "أدخل الرمز المكوّن من 6 أرقام", message: undefined };
    const challenge = (await cookies()).get(LOGIN_COOKIE)?.value ?? "";
    const v = await verifyOtp(challenge, code, "login");
    if (!v.ok) {
      const error =
        v.reason === "invalid" ? `الرمز غير صحيح. تبقّى ${v.attemptsLeft} ${v.attemptsLeft === 1 ? "محاولة" : "محاولات"}.`
        : v.reason === "exhausted" ? "استنفدت محاولات هذا الرمز. اطلب رمزًا جديدًا."
        : "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.";
      return { ...prev, step: "code", error, message: undefined, resendIn: v.reason === "invalid" ? prev.resendIn : 0 };
    }
    (await cookies()).delete(LOGIN_COOKIE);
    const c = classify(await findHolder(v.phone));
    if (c.kind === "banned") return { step: "phone", error: "هذا الرقم مرتبط بحساب محظور لمخالفة الشروط. إن كان ذلك خطأ فتواصل مع الدعم." };
    if (c.kind === "dormant") {
      await setFlowCookie(CLAIM_COOKIE, await issueClaimTicket(v.phone), 600);
      return { step: "recycled", phone: prev.phone, masked: maskPhone(v.phone) };
    }
    let userId: string;
    if (c.kind === "existing") userId = c.holder.id;
    else {
      try {
        userId = await createPhoneAccount(v.phone);
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
        const again = await findHolder(v.phone); // Two tabs raced; the other one created it.
        if (!again) throw e;
        userId = again.id;
      }
    }
    return finishSignIn(userId, next);
  }

  if (intent === "new_account") {
    const ticket = (await cookies()).get(CLAIM_COOKIE)?.value ?? "";
    (await cookies()).delete(CLAIM_COOKIE);
    const phone = await redeemClaimTicket(ticket);
    if (!phone) return { step: "phone", error: "انتهت صلاحية التحقق. أدخل رقمك مرة أخرى." };
    const c = classify(await findHolder(phone));
    let userId: string;
    if (c.kind === "dormant") {
      // Detach first (one account per number), create the new account, then finish the release.
      const [old] = await db.update(users).set({ phone: null }).where(eq(users.id, c.holder.id)).returning({ verifiedAt: users.phoneVerifiedAt });
      try {
        userId = await createPhoneAccount(phone);
      } catch (e) {
        await db.update(users).set({ phone, phoneVerifiedAt: old?.verifiedAt ?? null }).where(eq(users.id, c.holder.id));
        throw e;
      }
      await releaseNumber(c.holder.id, phone, userId);
    } else if (c.kind === "new") userId = await createPhoneAccount(phone);
    else return { step: "phone", error: "تغيّرت حالة هذا الرقم. أدخل رقمك مرة أخرى." };
    return finishSignIn(userId, next);
  }

  return { step: "phone" };
}

async function finishSignIn(userId: string, next: string): Promise<never> {
  await createSession(userId);
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, userId));
  const [p] = await db.select({ onboardedAt: profiles.onboardedAt }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  redirect(p?.onboardedAt ? safeNext(next, "/account") : `/onboarding?next=${encodeURIComponent(safeNext(next, "/account?welcome=1"))}`);
}

/* ───────────── Verify or change the number on a signed-in account ───────────── */

export async function verifyAccountPhone(prev: PhoneFlowState, form: FormData): Promise<PhoneFlowState> {
  return { ...(await verifyAccountPhoneStep(prev, form)), nonce: Date.now() };
}

async function verifyAccountPhoneStep(prev: PhoneFlowState, form: FormData): Promise<PhoneFlowState> {
  if (isVisualPreview()) return unavailable();
  const user = await assertUser({ allowSuspended: true });
  const intent = String(form.get("intent") ?? "send");
  const next = String(form.get("next") ?? "");

  if (intent === "edit") return { step: "phone", phone: prev.phone };

  if (intent === "send") {
    const raw = String(form.get("phone") ?? prev.phone ?? "");
    const phone = normalizeSaudiMobile(raw);
    if (!phone) return { step: "phone", phone: raw, fieldError: phoneProblem(raw) };
    if (phone === user.phone && user.phoneVerified) return { step: "phone", phone: raw, fieldError: "هذا هو رقمك الموثّق حاليًا." };
    const holder = await findHolder(phone);
    if (demoNumberBlocked(holder)) return { step: "phone", phone: raw, fieldError: "هذا الرقم مخصص لحسابات العرض." };
    const c = classify(holder);
    if (holder && holder.id !== user.id && (c.kind === "existing" || c.kind === "banned"))
      return { step: "phone", phone: raw, fieldError: "هذا الرقم مرتبط بحساب آخر. لكل رقم حساب نشط واحد فقط — إن كان رقمك فسجّل الدخول به." };
    const r = await issueOtp({ phone, purpose: "change", userId: user.id });
    if (!r.ok) {
      if (r.reason === "cooldown" && prev.step === "code") return { ...prev, error: sendError(r), resendIn: r.retryAfter };
      return r.reason === "unavailable" ? unavailable(raw) : { step: prev.step, phone: formatLocal(phone), masked: maskPhone(phone), error: sendError(r), resendIn: r.retryAfter };
    }
    await setFlowCookie(CHANGE_COOKIE, r.challengeId, OTP.ttlSeconds + 60);
    return { step: "code", phone: formatLocal(phone), masked: maskPhone(phone), resendIn: r.resendIn, message: prev.step === "code" ? "أرسلنا رمزًا جديدًا." : undefined };
  }

  if (intent === "verify") {
    const code = String(form.get("code") ?? "").replace(/\D/g, "");
    if (code.length !== OTP.length) return { ...prev, step: "code", error: "أدخل الرمز المكوّن من 6 أرقام", message: undefined };
    const v = await verifyOtp((await cookies()).get(CHANGE_COOKIE)?.value ?? "", code, "change");
    if (!v.ok) {
      const error = v.reason === "invalid" ? `الرمز غير صحيح. تبقّى ${v.attemptsLeft} ${v.attemptsLeft === 1 ? "محاولة" : "محاولات"}.` : v.reason === "exhausted" ? "استنفدت محاولات هذا الرمز. اطلب رمزًا جديدًا." : "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.";
      return { ...prev, step: "code", error, message: undefined, resendIn: v.reason === "invalid" ? prev.resendIn : 0 };
    }
    if (v.userId !== user.id) return { step: "phone", error: "انتهت صلاحية التحقق. أعد المحاولة." };
    (await cookies()).delete(CHANGE_COOKIE);
    const holder = await findHolder(v.phone);
    const c = classify(holder);
    if (holder && holder.id !== user.id) {
      if (c.kind !== "dormant") return { step: "phone", error: "هذا الرقم مرتبط بحساب آخر نشط." };
      await releaseNumber(holder.id, v.phone, user.id);
    }
    const [before] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, user.id)).limit(1);
    try {
      await db.update(users).set({ phone: v.phone, phoneVerifiedAt: new Date(), phoneReleasedAt: null }).where(eq(users.id, user.id));
    } catch (e) {
      if (isUniqueViolation(e)) return { step: "phone", error: "هذا الرقم مرتبط بحساب آخر." };
      throw e;
    }
    await recordPhoneChange(user.id, before?.phone && before.phone !== v.phone ? before.phone : null, v.phone);
    // A number change is a credential change: end every other session.
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, token ? hashToken(token) : "")));
    redirect(safeNext(next, "/account/settings?phone=verified"));
  }

  return { step: "phone" };
}
