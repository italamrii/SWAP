"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PHONE_REQUIRED_MESSAGE } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { favorites, listings } from "@/lib/db/schema";

export async function toggleFavorite(listingId: string): Promise<{ ok: boolean; saved?: boolean; error?: string; auth?: boolean; phoneRequired?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, auth: true, error: "سجّل دخولك لحفظ الإعلانات" };
  if (!user.eligible) return { ok: false, phoneRequired: user.status === "active", error: user.status === "active" ? PHONE_REQUIRED_MESSAGE : "حسابك موقوف مؤقتًا" };
  if (!z.string().uuid().safeParse(listingId).success) return { ok: false, error: "إعلان غير صالح" };

  const [listing] = await db.select({ price: listings.price, sellerId: listings.sellerId }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) return { ok: false, error: "الإعلان غير موجود" };

  const deleted = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, listingId)))
    .returning({ id: favorites.listingId });

  if (deleted.length) {
    await db.update(listings).set({ favoriteCount: sql`greatest(${listings.favoriteCount} - 1, 0)` }).where(eq(listings.id, listingId));
    revalidatePath("/account/favorites");
    return { ok: true, saved: false };
  }
  await db.insert(favorites).values({ userId: user.id, listingId, priceAtSave: listing.price }).onConflictDoNothing();
  await db.update(listings).set({ favoriteCount: sql`${listings.favoriteCount} + 1` }).where(eq(listings.id, listingId));
  revalidatePath("/account/favorites");
  return { ok: true, saved: true };
}

export async function setPriceAlert(listingId: string, enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "يلزم تسجيل الدخول" };
  if (!user.eligible) return { ok: false, error: PHONE_REQUIRED_MESSAGE };
  await db
    .update(favorites)
    .set({ notifyPriceDrop: enabled })
    .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, listingId)));
  revalidatePath("/account/favorites");
  return { ok: true };
}
