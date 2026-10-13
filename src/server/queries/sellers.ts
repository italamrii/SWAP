import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, profiles, users } from "@/lib/db/schema";
import type { ListingCardData } from "../types";
import { cardQuery } from "./listings";

export async function getSellerByUsername(username: string) {
  const [row] = await db
    .select({
      id: users.id,
      createdAt: users.createdAt,
      status: users.status,
      trusted: users.trusted,
      lastSeenAt: users.lastSeenAt,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
      city: profiles.city,
      responseRate: profiles.responseRate,
      responseTimeMinutes: profiles.responseTimeMinutes,
      completedDeals: profiles.completedDeals,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(sql`lower(${profiles.username}) = lower(${username})`)
    .limit(1);
  if (!row || row.status === "banned") return null;

  const [stats] = await db
    .select({
      active: sql<number>`count(*) filter (where ${listings.status} = 'active')::int`,
      sold: sql<number>`count(*) filter (where ${listings.status} = 'sold')::int`,
      verified: sql<number>`count(*) filter (where ${listings.status} in ('active','sold') and ${listings.verificationLevel} <> 'unverified')::int`,
    })
    .from(listings)
    .where(eq(listings.sellerId, row.id));

  const items = (await cardQuery()
    .where(and(eq(listings.sellerId, row.id), inArray(listings.status, ["active", "sold"])))
    .orderBy(sql`${listings.status} = 'sold'`, desc(listings.bumpedAt))
    .limit(60)) as ListingCardData[];

  return { seller: row, stats: stats ?? { active: 0, sold: 0, verified: 0 }, items };
}
