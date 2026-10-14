"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertEligible, assertUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { listings, offers } from "@/lib/db/schema";
import { run, type Result } from "./_utils";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  sold: ["active", "hidden"],
  hidden: ["active"],
  active: ["hidden", "sold"],
};

/** Owner status changes: mark sold, hide, re-activate. Moderation statuses are admin-only. */
export async function setListingStatus(input: { listingId: string; status: "active" | "sold" | "hidden" }): Promise<Result> {
  return run(async () => {
    const user = await assertEligible();
    const parsed = z.object({ listingId: z.string().uuid(), status: z.enum(["active", "sold", "hidden"]) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: "طلب غير صالح" };
    const { listingId, status } = parsed.data;
    const [l] = await db.select({ sellerId: listings.sellerId, status: listings.status, slug: listings.slug }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!l || l.sellerId !== user.id) return { ok: false, error: "الإعلان غير موجود" };
    if (!(STATUS_TRANSITIONS[status] ?? []).includes(l.status)) return { ok: false, error: "لا يمكن تغيير حالة هذا الإعلان الآن" };
    if (status === "active" && (await hasHoldingFlag(listingId))) return { ok: false, error: "الإعلان قيد مراجعة SWAP Guard ولا يمكن إظهاره حتى تنتهي المراجعة" };

    await db
      .update(listings)
      .set({ status, soldAt: status === "sold" ? new Date() : null, ...(status === "active" ? { bumpedAt: new Date() } : {}) })
      .where(eq(listings.id, listingId));
    if (status === "sold") {
      await db.update(offers).set({ status: "expired" }).where(and(eq(offers.listingId, listingId), inArray(offers.status, ["pending"])));
    }
    revalidatePath("/account/listings");
    revalidatePath(`/listing/${l.slug}`);
    const msg = { sold: "مبروك! علّمنا الإعلان كمُباع", hidden: "أخفينا الإعلان عن المتصفحين", active: "الإعلان ظاهر الآن" }[status];
    return { ok: true, message: msg };
  });
}

export async function deleteListing(listingId: string): Promise<Result> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    if (!z.string().uuid().safeParse(listingId).success) return { ok: false, error: "طلب غير صالح" };
    const deleted = await db.delete(listings).where(and(eq(listings.id, listingId), eq(listings.sellerId, user.id))).returning({ id: listings.id });
    if (!deleted.length) return { ok: false, error: "الإعلان غير موجود" };
    revalidatePath("/account/listings");
    return { ok: true, message: "حذفنا الإعلان" };
  });
}

import { redirect } from "next/navigation";
import { sql as dsql } from "drizzle-orm";
import { categories, favorites, listingAttributes, listingImages, listingPriceHistory } from "@/lib/db/schema";
import { specValidator, toAttributeRows } from "@/lib/catalog/helpers";
import { listingSlug } from "@/lib/slug";
import { formatSAR } from "@/lib/format";
import { listingBaseSchema, type ListingInput } from "@/lib/validation/listing";
import { notify } from "../notify";
import { applyListingGuard, evaluateListing, hasHoldingFlag } from "../services/guard";

type ListingFieldErrors = Record<string, string[] | undefined>;

async function validateListing(input: ListingInput) {
  const base = listingBaseSchema.safeParse(input);
  if (!base.success) return { error: base.error.flatten().fieldErrors as ListingFieldErrors };
  const d = base.data;
  const cats = await db.select().from(categories).where(eq(categories.isActive, true));
  const cat = cats.find((c) => c.slug === d.categorySlug && !c.parentId);
  if (!cat) return { error: { categorySlug: ["اختر قسمًا صحيحًا"] } as ListingFieldErrors };
  const sub = d.subcategorySlug ? cats.find((c) => c.slug === d.subcategorySlug && c.parentId === cat.id) : undefined;
  if (d.subcategorySlug && !sub) return { error: { subcategorySlug: ["القسم الفرعي غير صحيح"] } as ListingFieldErrors };
  const specs = specValidator(cat.schemaKey).safeParse(d.specs);
  if (!specs.success) {
    const fe = specs.error.flatten().fieldErrors as ListingFieldErrors;
    return { error: Object.fromEntries(Object.entries(fe).map(([k, v]) => [`specs.${k}`, v])) as ListingFieldErrors };
  }
  if (d.acceptsSwap && !d.swapDetails) d.swapDetails = undefined;
  const tags = [...new Set(d.tags.map((t) => t.replace(/^#/, "")))].slice(0, 8);
  return { data: { ...d, tags, specs: specs.data as Record<string, string | number | boolean>, cat, sub } };
}

async function writeChildren(listingId: string, schemaKey: string, specs: Record<string, string | number | boolean>, images: { url: string; width?: number; height?: number }[], title: string) {
  await db.delete(listingImages).where(eq(listingImages.listingId, listingId));
  await db.insert(listingImages).values(images.map((img, position) => ({ listingId, url: img.url, width: img.width, height: img.height, position, alt: title })));
  await db.delete(listingAttributes).where(eq(listingAttributes.listingId, listingId));
  const attrs = toAttributeRows(schemaKey, specs);
  if (attrs.length) await db.insert(listingAttributes).values(attrs.map((a) => ({ listingId, ...a })));
}

export async function createListing(input: ListingInput): Promise<Result & { fieldErrors?: ListingFieldErrors }> {
  const res = await run(async () => {
    const user = await assertEligible();
    const v = await validateListing(input);
    if ("error" in v) return { ok: false as const, error: "راجع الحقول المظللة بالأحمر", fieldErrors: v.error };
    const d = v.data;
    const [{ n }] = await db.select({ n: dsql<number>`count(*)::int` }).from(listings).where(and(eq(listings.sellerId, user.id), inArray(listings.status, ["active", "sold"])));
    // New sellers' first two listings go through moderation; trusted sellers publish directly.
    const id = crypto.randomUUID();
    const signals = await evaluateListing({ listingId: id, sellerId: user.id, title: d.title, description: d.description, price: d.price * 100, imageUrls: d.images.map((i) => i.url), sellerCreatedAt: user.createdAt });
    // Every signal evaluateListing returns needs a moderator before the listing goes live.
    const guardHold = signals.length > 0;
    const status = !guardHold && (user.trusted || n >= 2) ? "active" : "pending_review";
    const [row] = await db
      .insert(listings)
      .values({
        id, slug: listingSlug(d.title), sellerId: user.id, categoryId: d.cat.id, subcategoryId: d.sub?.id ?? null, title: d.title, description: d.description,
        price: d.price * 100, isNegotiable: d.isNegotiable, acceptsSwap: d.acceptsSwap, swapDetails: d.acceptsSwap ? d.swapDetails : null, condition: d.condition,
        city: d.city, district: d.district, specs: d.specs, tags: d.tags, status, coverImageUrl: d.images[0].url, publishedAt: status === "active" ? new Date() : null,
      })
      .returning({ id: listings.id });
    await writeChildren(row.id, d.cat.schemaKey, d.specs, d.images, d.title);
    if (await applyListingGuard(row.id, user.id, signals)) {
      revalidatePath("/account/listings");
      return { ok: true as const, data: "guard" };
    }
    if (status === "pending_review") {
      await notify(user.id, { type: "listing_status", title: "إعلانك قيد المراجعة", body: `سنراجع «${d.title}» خلال ساعات قليلة ونبلّغك فور نشره.`, href: "/account/listings" });
    }
    revalidatePath("/account/listings");
    return { ok: true as const, data: status };
  });
  if (res.ok) redirect(`/account/listings?created=${res.data === "active" ? "active" : res.data === "guard" ? "guard" : "pending"}`);
  return res;
}

export async function updateListing(listingId: string, input: ListingInput): Promise<Result & { fieldErrors?: ListingFieldErrors }> {
  const res = await run(async () => {
    const user = await assertEligible();
    if (!z.string().uuid().safeParse(listingId).success) return { ok: false as const, error: "طلب غير صالح" };
    const [existing] = await db.select().from(listings).where(and(eq(listings.id, listingId), eq(listings.sellerId, user.id))).limit(1);
    if (!existing) return { ok: false as const, error: "الإعلان غير موجود" };
    const v = await validateListing(input);
    if ("error" in v) return { ok: false as const, error: "راجع الحقول المظللة بالأحمر", fieldErrors: v.error };
    const d = v.data;
    const newPrice = d.price * 100;
    const signals = await evaluateListing({ listingId, sellerId: user.id, title: d.title, description: d.description, price: newPrice, imageUrls: d.images.map((i) => i.url), sellerCreatedAt: user.createdAt });
    // Editing never clears a SWAP Guard hold — only a moderator can.
    const held = existing.status !== "sold" && (await applyListingGuard(listingId, user.id, signals));
    const nextStatus = held || existing.status === "rejected" ? "pending_review" : existing.status;
    await db
      .update(listings)
      .set({
        categoryId: d.cat.id, subcategoryId: d.sub?.id ?? null, title: d.title, description: d.description, price: newPrice, isNegotiable: d.isNegotiable,
        acceptsSwap: d.acceptsSwap, swapDetails: d.acceptsSwap ? d.swapDetails : null, condition: d.condition, city: d.city, district: d.district,
        specs: d.specs, tags: d.tags, coverImageUrl: d.images[0].url, status: nextStatus, moderationNote: held ? "قيد مراجعة SWAP Guard" : nextStatus === "pending_review" ? null : existing.moderationNote,
        // Changing core hardware facts invalidates a previous verification.
        verificationLevel: existing.categoryId !== d.cat.id ? "unverified" : existing.verificationLevel,
      })
      .where(eq(listings.id, listingId));
    await writeChildren(listingId, d.cat.schemaKey, d.specs, d.images, d.title);

    if (newPrice !== existing.price) {
      await db.insert(listingPriceHistory).values({ listingId, oldPrice: existing.price, newPrice });
      if (newPrice < existing.price && existing.status === "active") {
        const watchers = await db.select({ userId: favorites.userId }).from(favorites).where(and(eq(favorites.listingId, listingId), eq(favorites.notifyPriceDrop, true)));
        for (const w of watchers) {
          await notify(w.userId, { type: "price_drop", title: "نزل سعر إعلان في مفضلتك", body: `«${d.title}» صار ${formatSAR(newPrice)} بدل ${formatSAR(existing.price)}.`, href: `/listing/${existing.slug}` });
        }
      }
    }
    revalidatePath(`/listing/${existing.slug}`);
    revalidatePath("/account/listings");
    return { ok: true as const, data: existing.slug };
  });
  if (res.ok) redirect(`/listing/${res.data}`);
  return res;
}
