"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertEligible, assertUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { listings, offers, swapOffers } from "@/lib/db/schema";
import { formatSAR } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { priceOfferSchema, swapOfferSchema, type SwapOfferInput } from "@/lib/validation/offers";
import { notify } from "../notify";
import { appendMessage, ensureConversation, senderName } from "../services/conversations";
import { acknowledge, evaluateMessage, listingDealWarnings, unacknowledged } from "../services/guard";
import { guardPrompt, run, zodFail, type Result } from "./_utils";

const OFFER_TTL_DAYS = 5;

async function supersedePending(listingId: string, buyerId: string) {
  await db
    .update(offers)
    .set({ status: "withdrawn", respondedAt: new Date() })
    .where(and(eq(offers.listingId, listingId), eq(offers.buyerId, buyerId), eq(offers.status, "pending")));
}

/** Deal warnings (new seller, reports, unrealistic price) and the offer note's content need one acknowledgement. */
async function offerGuard(userId: string, listingId: string, note: string | undefined, ack: boolean | undefined) {
  const verdict = note ? await evaluateMessage(userId, null, note) : { codes: [] as string[], senderWarnings: [] as string[] };
  if ("block" in verdict && verdict.block) return { fail: { ok: false as const, error: verdict.block } };
  const pendingDeal = await unacknowledged(userId, "listing", listingId, await listingDealWarnings(listingId));
  const pendingDraft = await unacknowledged(userId, "message_draft", listingId, verdict.senderWarnings.map((code) => ({ code, severity: "warn" as const })));
  if ((pendingDeal.length || pendingDraft.length) && !ack) return { fail: guardPrompt([...pendingDeal, ...pendingDraft]) };
  return {
    codes: verdict.codes,
    commit: async () => {
      await acknowledge(userId, "listing", listingId, pendingDeal);
      await acknowledge(userId, "message_draft", listingId, pendingDraft);
    },
  };
}

export async function makePriceOffer(input: { listingId: string; amount: number | string; note?: string; ack?: boolean }): Promise<Result<{ conversationId: string }>> {
  return run(async () => {
    const user = await assertEligible();
    const parsed = priceOfferSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    if (!(await rateLimit(`offer:${user.id}`, 15, 3600))) return { ok: false, error: "قدّمت عروضًا كثيرة خلال وقت قصير." };
    const { listingId, amount, note } = parsed.data;
    const [listing] = await db.select({ price: listings.price, isNegotiable: listings.isNegotiable }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing) return { ok: false, error: "الإعلان غير موجود" };
    if (!listing.isNegotiable) return { ok: false, error: "البائع حدّد أن السعر غير قابل للتفاوض. تقدر تراسله مباشرة." };
    const halalas = amount * 100;
    if (halalas >= listing.price) return { ok: false, fieldErrors: { amount: ["العرض يساوي السعر المطلوب أو أعلى — راسل البائع مباشرة"] }, error: "العرض يساوي السعر المطلوب أو أعلى" };
    if (halalas < listing.price * 0.3) return { ok: false, fieldErrors: { amount: ["العرض منخفض جدًا مقارنة بالسعر المطلوب"] }, error: "العرض منخفض جدًا" };
    const g = await offerGuard(user.id, listingId, note, input.ack);
    if (g.fail) return g.fail;

    const conv = await ensureConversation(listingId, user.id);
    if ("error" in conv) return { ok: false, error: conv.error! };
    await supersedePending(listingId, user.id);
    const [offer] = await db
      .insert(offers)
      .values({ listingId, conversationId: conv.id, buyerId: user.id, sellerId: conv.listing.sellerId, type: "price", amount: halalas, note, expiresAt: new Date(Date.now() + OFFER_TTL_DAYS * 864e5) })
      .returning();
    await g.commit();
    await appendMessage(conv.id, user.id, `عرض سعر: ${formatSAR(halalas)}`, "offer", offer.id);
    if (note) await appendMessage(conv.id, user.id, note, "text", undefined, g.codes);
    await notify(conv.listing.sellerId, {
      type: "offer",
      title: `عرض سعر جديد: ${formatSAR(halalas)}`,
      body: `${await senderName(user.id)} قدّم عرضًا على «${conv.listing.title}».`,
      href: `/account/messages/${conv.id}`,
    });
    revalidatePath("/account/offers");
    return { ok: true, data: { conversationId: conv.id } };
  });
}

export async function makeSwapOffer(input: SwapOfferInput & { ack?: boolean }): Promise<Result<{ conversationId: string }>> {
  return run(async () => {
    const user = await assertEligible();
    const parsed = swapOfferSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    if (!(await rateLimit(`offer:${user.id}`, 15, 3600))) return { ok: false, error: "قدّمت عروضًا كثيرة خلال وقت قصير." };
    const d = parsed.data;
    const [listing] = await db.select({ acceptsSwap: listings.acceptsSwap }).from(listings).where(eq(listings.id, d.listingId)).limit(1);
    if (!listing) return { ok: false, error: "الإعلان غير موجود" };
    if (!listing.acceptsSwap) return { ok: false, error: "هذا الإعلان لا يقبل البدل" };
    if (d.offeredListingId) {
      const [own] = await db.select({ sellerId: listings.sellerId, status: listings.status }).from(listings).where(eq(listings.id, d.offeredListingId)).limit(1);
      if (!own || own.sellerId !== user.id || own.status !== "active") return { ok: false, error: "الإعلان المرتبط بالعرض غير صالح" };
    }

    const g = await offerGuard(user.id, d.listingId, [d.note, d.offeredDescription].filter(Boolean).join("\n") || undefined, input.ack);
    if (g.fail) return g.fail;
    const conv = await ensureConversation(d.listingId, user.id);
    if ("error" in conv) return { ok: false, error: conv.error! };
    await g.commit();
    await supersedePending(d.listingId, user.id);
    const offer = await db.transaction(async (tx) => {
      const [o] = await tx
        .insert(offers)
        .values({ listingId: d.listingId, conversationId: conv.id, buyerId: user.id, sellerId: conv.listing.sellerId, type: "swap", note: d.note, expiresAt: new Date(Date.now() + OFFER_TTL_DAYS * 864e5) })
        .returning();
      await tx.insert(swapOffers).values({
        offerId: o.id,
        offeredTitle: d.offeredTitle,
        offeredCategoryId: d.offeredCategoryId,
        offeredCondition: d.offeredCondition,
        offeredDescription: d.offeredDescription,
        offeredListingId: d.offeredListingId,
        cashDirection: d.cashDirection,
        cashAmount: d.cashDirection === "none" ? 0 : d.cashAmount * 100,
      });
      return o;
    });
    await appendMessage(conv.id, user.id, `اقتراح بدل: ${d.offeredTitle}`, "offer", offer.id);
    if (d.note) await appendMessage(conv.id, user.id, d.note, "text", undefined, g.codes);
    const cash = d.cashDirection === "none" ? "بدون فرق" : d.cashDirection === "buyer_pays" ? `+ ${formatSAR(d.cashAmount * 100)} لك` : `+ ${formatSAR(d.cashAmount * 100)} منك`;
    await notify(conv.listing.sellerId, {
      type: "offer",
      title: `اقتراح بدل على «${conv.listing.title}»`,
      body: `${await senderName(user.id)} يعرض ${d.offeredTitle} (${cash}).`,
      href: `/account/messages/${conv.id}`,
    });
    revalidatePath("/account/offers");
    return { ok: true, data: { conversationId: conv.id } };
  });
}

export async function respondToOffer(input: { offerId: string; decision: "accept" | "reject" }): Promise<Result> {
  return run(async () => {
    const user = await assertEligible();
    const parsed = z.object({ offerId: z.string().uuid(), decision: z.enum(["accept", "reject"]) }).safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    const [offer] = await db.select().from(offers).where(eq(offers.id, parsed.data.offerId)).limit(1);
    if (!offer || offer.sellerId !== user.id) return { ok: false, error: "العرض غير موجود" };
    if (offer.status !== "pending") return { ok: false, error: "تم الرد على هذا العرض مسبقًا" };
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      await db.update(offers).set({ status: "expired" }).where(eq(offers.id, offer.id));
      return { ok: false, error: "انتهت صلاحية العرض" };
    }
    const accepted = parsed.data.decision === "accept";
    await db.update(offers).set({ status: accepted ? "accepted" : "rejected", respondedAt: new Date() }).where(and(eq(offers.id, offer.id), eq(offers.status, "pending")));
    const label = offer.type === "swap" ? "اقتراح البدل" : "عرض السعر";
    await appendMessage(
      offer.conversationId,
      null,
      accepted ? `✅ قبل البائع ${label}. اتفقوا على موعد ومكان عام للمعاينة والتسليم.` : `رفض البائع ${label}. تقدر تقدّم عرضًا آخر أو تكمل النقاش.`,
      "system",
      offer.id,
    );
    await notify(offer.buyerId, {
      type: "offer_update",
      title: accepted ? `تم قبول ${label} 🎉` : `تم رفض ${label}`,
      body: accepted ? "نسّق مع البائع موعد المعاينة في مكان عام." : "تقدر تقدّم عرضًا جديدًا.",
      href: `/account/messages/${offer.conversationId}`,
    });
    revalidatePath("/account/offers");
    revalidatePath(`/account/messages/${offer.conversationId}`);
    return { ok: true, message: accepted ? "قبلت العرض — بلّغنا المشتري" : "رفضت العرض" };
  });
}

export async function withdrawOffer(offerId: string): Promise<Result> {
  return run(async () => {
    const user = await assertUser();
    if (!z.string().uuid().safeParse(offerId).success) return { ok: false, error: "عرض غير صالح" };
    const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
    if (!offer || offer.buyerId !== user.id) return { ok: false, error: "العرض غير موجود" };
    if (offer.status !== "pending") return { ok: false, error: "لا يمكن سحب هذا العرض" };
    await db.update(offers).set({ status: "withdrawn", respondedAt: new Date() }).where(eq(offers.id, offerId));
    await appendMessage(offer.conversationId, null, "سحب المشتري العرض.", "system", offer.id);
    revalidatePath("/account/offers");
    return { ok: true, message: "تم سحب العرض" };
  });
}
