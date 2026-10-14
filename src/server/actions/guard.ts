"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertEligible, assertStaff, assertUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { adminAuditLogs, appeals, guardFlags, listings, mediaFingerprints, possessionProofs } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { isTrustedImageUrl } from "@/lib/validation/listing";
import { notify } from "../notify";
import { newProofCode } from "../services/guard";
import { run, type Result } from "./_utils";

const uuid = z.string().uuid();

async function audit(actorId: string, action: string, targetType: string, targetId: string, meta: Record<string, unknown> = {}) {
  await db.insert(adminAuditLogs).values({ actorId, action, targetType, targetId, meta });
}

/* ───────────── seller ───────────── */

export async function submitPossessionProof(input: { proofId: string; imageUrl: string }): Promise<Result> {
  return run(async () => {
    const user = await assertEligible();
    const p = z.object({ proofId: uuid, imageUrl: z.string().refine(isTrustedImageUrl, "صورة غير صالحة") }).safeParse(input);
    if (!p.success) return { ok: false, error: "ارفع صورة صالحة" };
    const [proof] = await db.select().from(possessionProofs).where(and(eq(possessionProofs.id, p.data.proofId), eq(possessionProofs.userId, user.id))).limit(1);
    if (!proof || proof.status !== "requested") return { ok: false, error: "لا يوجد طلب إثبات مفتوح" };
    // The photo must be a fresh upload by this seller (it was fingerprinted on upload).
    const [fp] = await db.select({ owner: mediaFingerprints.ownerId }).from(mediaFingerprints).where(eq(mediaFingerprints.url, p.data.imageUrl)).limit(1);
    if (!fp || fp.owner !== user.id) return { ok: false, error: "ارفع الصورة من جهازك مباشرة" };
    await db.update(possessionProofs).set({ imageUrl: p.data.imageUrl, status: "submitted", submittedAt: new Date() }).where(eq(possessionProofs.id, proof.id));
    revalidatePath(`/account/listings/${proof.listingId}/guard`);
    return { ok: true, message: "أرسلنا الصورة لفريق المراجعة. نبلّغك فور البت فيها." };
  });
}

export async function submitAppeal(input: { flagId: string; reason: string }): Promise<Result> {
  return run(async () => {
    // Appeals stay open even to accounts that lost eligibility — that's what they're for.
    const user = await assertUser({ allowSuspended: true });
    const p = z.object({ flagId: uuid, reason: z.string().trim().min(20, "اشرح موقفك في 20 حرفًا على الأقل").max(1500, "الاعتراض طويل") }).safeParse(input);
    if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "طلب غير صالح" };
    if (!(await rateLimit(`appeal:${user.id}`, 5, 86400))) return { ok: false, error: "قدّمت اعتراضات كثيرة اليوم." };
    const [flag] = await db.select().from(guardFlags).where(eq(guardFlags.id, p.data.flagId)).limit(1);
    if (!flag || flag.userId !== user.id) return { ok: false, error: "لا يوجد قرار يمكن الاعتراض عليه" };
    const [open] = await db.select({ id: appeals.id }).from(appeals).where(and(eq(appeals.flagId, flag.id), eq(appeals.status, "open"))).limit(1);
    if (open) return { ok: false, error: "لديك اعتراض قيد المراجعة على هذا القرار" };
    await db.insert(appeals).values({ userId: user.id, flagId: flag.id, targetType: flag.subjectType === "user" ? "account" : flag.subjectType, targetId: flag.subjectId, reason: p.data.reason });
    if (flag.subjectType === "listing") revalidatePath(`/account/listings/${flag.subjectId}/guard`);
    return { ok: true, message: "وصلنا اعتراضك. سيراجعه مشرف آخر ونبلّغك بالنتيجة." };
  });
}

/* ───────────── moderation ───────────── */

/** Publish a held listing once nothing holds it any more. */
async function releaseListingIfClear(listingId: string, actorId: string) {
  const [stillOpen] = await db.select({ id: guardFlags.id }).from(guardFlags).where(and(eq(guardFlags.subjectType, "listing"), eq(guardFlags.subjectId, listingId), eq(guardFlags.status, "open"), eq(guardFlags.holding, true))).limit(1);
  if (stillOpen) return false;
  const [l] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!l || l.status !== "pending_review") return false;
  const now = new Date();
  await db.update(listings).set({ status: "active", publishedAt: l.publishedAt ?? now, bumpedAt: now, moderationNote: null }).where(eq(listings.id, listingId));
  await audit(actorId, "listing.approve", "listing", listingId, { via: "swap_guard" });
  await notify(l.sellerId, { type: "listing_status", title: "تم نشر إعلانك 🎉", body: `انتهت مراجعة «${l.title}» وهو ظاهر الآن للمشترين.`, href: `/listing/${l.slug}` });
  return true;
}

async function clearFlag(flagId: string, staffId: string, note: string | undefined) {
  const [f] = await db.update(guardFlags).set({ status: "cleared", reviewerId: staffId, reviewNote: note ?? null, reviewedAt: new Date() }).where(and(eq(guardFlags.id, flagId), eq(guardFlags.status, "open"))).returning();
  if (!f) return null;
  if (f.subjectType === "listing") {
    // A cleared case needs no further proof.
    await db.update(possessionProofs).set({ status: "approved", reviewerId: staffId, reviewedAt: new Date(), reviewNote: "أُغلقت المراجعة" }).where(and(eq(possessionProofs.listingId, f.subjectId), inArray(possessionProofs.status, ["requested", "submitted"])));
    await releaseListingIfClear(f.subjectId, staffId);
  }
  return f;
}

export async function reviewGuardFlag(input: { flagId: string; decision: "clear" | "confirm"; note?: string }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    const p = z.object({ flagId: uuid, decision: z.enum(["clear", "confirm"]), note: z.string().trim().max(300).optional() }).safeParse(input);
    if (!p.success) return { ok: false, error: "طلب غير صالح" };
    const { flagId, decision, note } = p.data;
    if (decision === "clear") {
      const f = await clearFlag(flagId, staff.id, note);
      if (!f) return { ok: false, error: "تمت مراجعة هذا التنبيه مسبقًا" };
      await audit(staff.id, "guard.flag.clear", f.subjectType, f.subjectId, { flagId, note });
    } else {
      if (!note) return { ok: false, error: "اكتب سبب التأكيد ليعرفه صاحب العلاقة" };
      const [f] = await db.update(guardFlags).set({ status: "confirmed", reviewerId: staff.id, reviewNote: note, reviewedAt: new Date() }).where(and(eq(guardFlags.id, flagId), eq(guardFlags.status, "open"))).returning();
      if (!f) return { ok: false, error: "تمت مراجعة هذا التنبيه مسبقًا" };
      if (f.subjectType === "listing") {
        const [l] = await db.update(listings).set({ status: "rejected", moderationNote: `SWAP Guard: ${note}` }).where(eq(listings.id, f.subjectId)).returning({ sellerId: listings.sellerId, title: listings.title });
        if (l) await notify(l.sellerId, { type: "listing_status", title: "لم يُنشر إعلانك", body: `«${l.title}»: ${note}. يمكنك تقديم اعتراض.`, href: `/account/listings/${f.subjectId}/guard` });
      }
      await audit(staff.id, "guard.flag.confirm", f.subjectType, f.subjectId, { flagId, note });
    }
    revalidatePath("/admin/guard");
    return { ok: true, message: decision === "clear" ? "أُغلق التنبيه" : "تم تأكيد المخالفة" };
  });
}

export async function reviewPossessionProof(input: { proofId: string; decision: "approve" | "reject"; note?: string }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    const p = z.object({ proofId: uuid, decision: z.enum(["approve", "reject"]), note: z.string().trim().max(300).optional() }).safeParse(input);
    if (!p.success) return { ok: false, error: "طلب غير صالح" };
    const { proofId, decision, note } = p.data;
    if (decision === "reject" && !note) return { ok: false, error: "اكتب سبب الرفض (مثلًا: الكود غير واضح)" };
    const [proof] = await db.update(possessionProofs).set({ status: decision === "approve" ? "approved" : "rejected", reviewerId: staff.id, reviewNote: note ?? null, reviewedAt: new Date() }).where(and(eq(possessionProofs.id, proofId), eq(possessionProofs.status, "submitted"))).returning();
    if (!proof) return { ok: false, error: "تمت مراجعة هذه الصورة مسبقًا" };
    if (decision === "approve") {
      // The photo resolves the evidence questions it was requested for; clear the listing's open holds.
      const open = await db.select({ id: guardFlags.id }).from(guardFlags).where(and(eq(guardFlags.subjectType, "listing"), eq(guardFlags.subjectId, proof.listingId), eq(guardFlags.status, "open")));
      for (const f of open) await clearFlag(f.id, staff.id, "صورة إثبات الحيازة مقبولة");
      await releaseListingIfClear(proof.listingId, staff.id);
    } else {
      await db.insert(possessionProofs).values({ listingId: proof.listingId, userId: proof.userId, code: newProofCode(), reason: proof.reason });
      await notify(proof.userId, { type: "listing_status", title: "نحتاج صورة إثبات جديدة", body: note, href: `/account/listings/${proof.listingId}/guard` });
    }
    await audit(staff.id, `guard.proof.${decision}`, "listing", proof.listingId, { proofId, note });
    revalidatePath("/admin/guard");
    return { ok: true, message: decision === "approve" ? "قُبلت الصورة" : "رُفضت الصورة وطُلب إثبات جديد" };
  });
}

export async function resolveAppeal(input: { appealId: string; decision: "accept" | "reject"; note: string }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    const p = z.object({ appealId: uuid, decision: z.enum(["accept", "reject"]), note: z.string().trim().min(3, "اكتب ملاحظة للمستخدم").max(500) }).safeParse(input);
    if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "طلب غير صالح" };
    const { appealId, decision, note } = p.data;
    const [a] = await db.update(appeals).set({ status: decision === "accept" ? "accepted" : "rejected", reviewerId: staff.id, reviewNote: note, resolvedAt: new Date() }).where(and(eq(appeals.id, appealId), eq(appeals.status, "open"))).returning();
    if (!a) return { ok: false, error: "تمت مراجعة هذا الاعتراض مسبقًا" };
    if (decision === "accept" && a.flagId) {
      const [flag] = await db.select().from(guardFlags).where(eq(guardFlags.id, a.flagId)).limit(1);
      if (flag?.status === "open") await clearFlag(flag.id, staff.id, `اعتراض مقبول: ${note}`);
      else if (flag?.status === "confirmed") {
        await db.update(guardFlags).set({ status: "cleared", reviewerId: staff.id, reviewNote: `اعتراض مقبول: ${note}`, reviewedAt: new Date() }).where(eq(guardFlags.id, flag.id));
        if (flag.subjectType === "listing") {
          await db.update(listings).set({ status: "pending_review", moderationNote: null }).where(and(eq(listings.id, flag.subjectId), eq(listings.status, "rejected")));
          await releaseListingIfClear(flag.subjectId, staff.id);
        }
      }
    }
    await notify(a.userId, { type: "system", title: decision === "accept" ? "قُبل اعتراضك" : "لم يُقبل اعتراضك", body: note, href: a.targetType === "listing" ? `/account/listings/${a.targetId}/guard` : "/account" });
    await audit(staff.id, `guard.appeal.${decision}`, a.targetType, a.targetId, { appealId, note });
    revalidatePath("/admin/guard");
    return { ok: true, message: decision === "accept" ? "قُبل الاعتراض" : "رُفض الاعتراض" };
  });
}
