import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { favorites, inspections, listings, notifications } from "@/lib/db/schema";
import type { ListingCardData } from "../types";
import { cardColumns, cardQuery, rootCat } from "./listings";

export async function getDashboard(userId: string) {
  const [stats] = await db
    .select({
      active: sql<number>`count(*) filter (where ${listings.status} = 'active')::int`,
      pending: sql<number>`count(*) filter (where ${listings.status} = 'pending_review')::int`,
      sold: sql<number>`count(*) filter (where ${listings.status} = 'sold')::int`,
      views: sql<number>`coalesce(sum(${listings.viewCount}) filter (where ${listings.status} = 'active'), 0)::int`,
      saves: sql<number>`coalesce(sum(${listings.favoriteCount}) filter (where ${listings.status} = 'active'), 0)::int`,
      unverified: sql<number>`count(*) filter (where ${listings.status} = 'active' and ${listings.verificationLevel} = 'unverified')::int`,
    })
    .from(listings)
    .where(eq(listings.sellerId, userId));
  const recent = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(6);
  const [fav] = await db.select({ n: sql<number>`count(*)::int` }).from(favorites).where(eq(favorites.userId, userId));
  return { stats: stats!, recent, favorites: fav?.n ?? 0 };
}

export async function getMyListings(userId: string) {
  const rows = await db
    .select({
      ...cardColumns,
      viewCount: listings.viewCount,
      favoriteCount: listings.favoriteCount,
      moderationNote: listings.moderationNote,
      createdAt: listings.createdAt,
      pendingInspection: sql<boolean>`exists (select 1 from ${inspections} i where i.listing_id = ${listings.id} and i.status = 'submitted')`,
    })
    .from(listings)
    .innerJoin(rootCat, eq(rootCat.id, listings.categoryId))
    .where(eq(listings.sellerId, userId))
    .orderBy(desc(listings.updatedAt));
  return rows;
}

export async function getFavorites(userId: string) {
  const rows = await cardQuery()
    .innerJoin(favorites, eq(favorites.listingId, listings.id))
    .where(and(eq(favorites.userId, userId)))
    .orderBy(desc(favorites.createdAt));
  const meta = await db.select().from(favorites).where(eq(favorites.userId, userId));
  const byId = new Map(meta.map((m) => [m.listingId, m]));
  return (rows as ListingCardData[]).map((l) => ({ listing: l, priceAtSave: byId.get(l.id)!.priceAtSave, notify: byId.get(l.id)!.notifyPriceDrop }));
}
