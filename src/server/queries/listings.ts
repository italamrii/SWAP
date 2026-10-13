import "server-only";
import { and, asc, desc, eq, getTableColumns, gte, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  categories,
  favorites,
  inspectionAttachments,
  inspectionReports,
  inspections,
  listingAttributes,
  listingImages,
  listingPriceHistory,
  listings,
  profiles,
  users,
} from "@/lib/db/schema";
import { PAGE_SIZE, type BrowseFilters } from "@/lib/browse-params";
import type { ListingCardData } from "../types";

const rootCat = alias(categories, "root_cat");

export const cardColumns = {
  id: listings.id,
  slug: listings.slug,
  title: listings.title,
  price: listings.price,
  city: listings.city,
  condition: listings.condition,
  acceptsSwap: listings.acceptsSwap,
  isNegotiable: listings.isNegotiable,
  verificationLevel: listings.verificationLevel,
  coverImageUrl: listings.coverImageUrl,
  specs: listings.specs,
  status: listings.status,
  publishedAt: listings.publishedAt,
  bumpedAt: listings.bumpedAt,
  categorySlug: rootCat.slug,
  categoryNameAr: rootCat.nameAr,
  categoryIcon: rootCat.icon,
  schemaKey: rootCat.schemaKey,
};

export function cardQuery() {
  return db.select(cardColumns).from(listings).innerJoin(rootCat, eq(rootCat.id, listings.categoryId));
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export function textSearchCondition(q: string): SQL {
  const like = `%${escapeLike(q)}%`;
  return or(
    sql`${listings.searchVector} @@ websearch_to_tsquery('simple', ${q})`,
    sql`${listings.title} ILIKE ${like}`,
    sql`array_to_string(${listings.tags}, ' ') ILIKE ${like}`,
  )!;
}

export interface SearchInput extends BrowseFilters {
  categoryId?: number;
  subcategoryId?: number;
}

/** Faceted, paginated listing search. Only active listings are ever returned. */
export async function searchListings(f: SearchInput) {
  const where: SQL[] = [eq(listings.status, "active")];
  if (f.categoryId) where.push(eq(listings.categoryId, f.categoryId));
  if (f.subcategoryId) where.push(eq(listings.subcategoryId, f.subcategoryId));
  if (f.q) where.push(textSearchCondition(f.q));
  if (f.city) where.push(eq(listings.city, f.city));
  if (f.min !== undefined) where.push(gte(listings.price, Math.round(f.min * 100)));
  if (f.max !== undefined) where.push(lte(listings.price, Math.round(f.max * 100)));
  if (f.conditions.length) where.push(inArray(listings.condition, f.conditions as (typeof listings.condition.enumValues)[number][]));
  if (f.verified) where.push(ne(listings.verificationLevel, "unverified"));
  if (f.swap) where.push(eq(listings.acceptsSwap, true));
  if (f.negotiable) where.push(eq(listings.isNegotiable, true));

  for (const [key, values] of Object.entries(f.attrs)) {
    where.push(sql`exists (select 1 from ${listingAttributes} la where la.listing_id = ${listings.id} and la.key = ${key} and la.value_text in ${values})`);
  }
  for (const [key, r] of Object.entries(f.ranges)) {
    const conds = [sql`la.listing_id = ${listings.id}`, sql`la.key = ${key}`];
    if (r.min !== undefined) conds.push(sql`la.value_num >= ${r.min}`);
    if (r.max !== undefined) conds.push(sql`la.value_num <= ${r.max}`);
    where.push(sql`exists (select 1 from ${listingAttributes} la where ${sql.join(conds, sql` and `)})`);
  }

  const order =
    f.sort === "price_asc" ? [asc(listings.price)]
    : f.sort === "price_desc" ? [desc(listings.price)]
    : f.sort === "verified" ? [sql`case ${listings.verificationLevel} when 'partner_verified' then 3 when 'platform_checked' then 2 when 'seller_report' then 1 else 0 end desc`, desc(listings.bumpedAt)]
    : [desc(listings.bumpedAt)];

  const rows = await db
    .select({ ...cardColumns, total: sql<number>`count(*) over()::int` })
    .from(listings)
    .innerJoin(rootCat, eq(rootCat.id, listings.categoryId))
    .where(and(...where))
    .orderBy(...order, desc(listings.id))
    .limit(PAGE_SIZE)
    .offset((f.page - 1) * PAGE_SIZE);

  const total = rows[0]?.total ?? 0;
  return {
    items: rows.map(({ total: _t, ...r }) => r) as ListingCardData[],
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Value counts for a category's filterable attributes (drives facet counts in filters). */
export async function getAttributeFacets(categoryId: number) {
  const rows = await db
    .select({ key: listingAttributes.key, value: listingAttributes.valueText, count: sql<number>`count(*)::int` })
    .from(listingAttributes)
    .innerJoin(listings, eq(listings.id, listingAttributes.listingId))
    .where(and(eq(listings.status, "active"), eq(listings.categoryId, categoryId), sql`${listingAttributes.valueText} is not null`))
    .groupBy(listingAttributes.key, listingAttributes.valueText);
  const out: Record<string, Record<string, number>> = {};
  for (const r of rows) (out[r.key] ??= {})[r.value!] = r.count;
  return out;
}

export async function getLatestListings(limit = 8, opts: { verifiedOnly?: boolean; swapOnly?: boolean } = {}) {
  const where: SQL[] = [eq(listings.status, "active")];
  if (opts.verifiedOnly) where.push(ne(listings.verificationLevel, "unverified"));
  if (opts.swapOnly) where.push(eq(listings.acceptsSwap, true));
  return (await cardQuery().where(and(...where)).orderBy(desc(listings.bumpedAt)).limit(limit)) as ListingCardData[];
}

export async function getListingBySlug(slug: string) {
  const subCat = alias(categories, "sub_cat");
  const [flat] = await db
    .select({
      ...getTableColumns(listings),
      catId: rootCat.id, catSlug: rootCat.slug, catNameAr: rootCat.nameAr, catIcon: rootCat.icon, catSchemaKey: rootCat.schemaKey,
      subId: subCat.id, subSlug: subCat.slug, subNameAr: subCat.nameAr,
    })
    .from(listings)
    .innerJoin(rootCat, eq(rootCat.id, listings.categoryId))
    .leftJoin(subCat, eq(subCat.id, listings.subcategoryId))
    .where(eq(listings.slug, slug))
    .limit(1);
  if (!flat) return null;
  const { catId, catSlug, catNameAr, catIcon, catSchemaKey, subId, subSlug, subNameAr, ...listing } = flat;
  const row = {
    listing,
    category: { id: catId, slug: catSlug, nameAr: catNameAr, icon: catIcon, schemaKey: catSchemaKey },
    subcategory: subId ? { id: subId, slug: subSlug!, nameAr: subNameAr! } : null,
  };

  const [seller] = await db
    .select({
      id: users.id,
      createdAt: users.createdAt,
      status: users.status,
      trusted: users.trusted,
      lastSeenAt: users.lastSeenAt,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      city: profiles.city,
      phone: profiles.phone,
      showPhone: profiles.showPhone,
      responseRate: profiles.responseRate,
      responseTimeMinutes: profiles.responseTimeMinutes,
      completedDeals: profiles.completedDeals,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, row.listing.sellerId))
    .limit(1);
  if (!seller) return null;

  const [images, inspection, sellerStats, priceHistory] = await Promise.all([
    db.select().from(listingImages).where(eq(listingImages.listingId, row.listing.id)).orderBy(asc(listingImages.position)),
    getApprovedInspection(row.listing.id),
    db
      .select({
        active: sql<number>`count(*) filter (where ${listings.status} = 'active')::int`,
        sold: sql<number>`count(*) filter (where ${listings.status} = 'sold')::int`,
        verified: sql<number>`count(*) filter (where ${listings.status} in ('active','sold') and ${listings.verificationLevel} <> 'unverified')::int`,
      })
      .from(listings)
      .where(eq(listings.sellerId, seller.id)),
    db.select().from(listingPriceHistory).where(eq(listingPriceHistory.listingId, row.listing.id)).orderBy(desc(listingPriceHistory.createdAt)).limit(1),
  ]);

  return {
    ...row,
    seller,
    images,
    inspection,
    sellerStats: sellerStats[0] ?? { active: 0, sold: 0, verified: 0 },
    lastPriceChange: priceHistory[0] ?? null,
  };
}
export type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListingBySlug>>>;

/** The most recent approved inspection with its report and evidence. */
export async function getApprovedInspection(listingId: string) {
  const [insp] = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.listingId, listingId), eq(inspections.status, "approved")))
    .orderBy(desc(inspections.reviewedAt))
    .limit(1);
  if (!insp) return null;
  const [report] = await db.select().from(inspectionReports).where(eq(inspectionReports.inspectionId, insp.id)).limit(1);
  const attachments = await db.select().from(inspectionAttachments).where(eq(inspectionAttachments.inspectionId, insp.id));
  return { ...insp, report: report ?? null, attachments };
}
export type ApprovedInspection = NonNullable<Awaited<ReturnType<typeof getApprovedInspection>>>;

export async function getSimilarListings(listingId: string, categoryId: number, limit = 4) {
  return (await cardQuery()
    .where(and(eq(listings.status, "active"), eq(listings.categoryId, categoryId), ne(listings.id, listingId)))
    .orderBy(desc(listings.bumpedAt))
    .limit(limit)) as ListingCardData[];
}

export async function getSellerOtherListings(sellerId: string, excludeId: string, limit = 4) {
  return (await cardQuery()
    .where(and(eq(listings.status, "active"), eq(listings.sellerId, sellerId), ne(listings.id, excludeId)))
    .orderBy(desc(listings.bumpedAt))
    .limit(limit)) as ListingCardData[];
}

export async function getFavoriteIdSet(userId: string | undefined, listingIds: string[]) {
  if (!userId || listingIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ id: favorites.listingId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.listingId, listingIds)));
  return new Set(rows.map((r) => r.id));
}

export async function getMarketplaceStats() {
  const [row] = await db
    .select({
      active: sql<number>`count(*) filter (where ${listings.status} = 'active')::int`,
      verified: sql<number>`count(*) filter (where ${listings.status} = 'active' and ${listings.verificationLevel} <> 'unverified')::int`,
      swap: sql<number>`count(*) filter (where ${listings.status} = 'active' and ${listings.acceptsSwap})::int`,
    })
    .from(listings);
  return row ?? { active: 0, verified: 0, swap: 0 };
}

/** Title + category suggestions for the search box. */
export async function suggestListings(q: string, limit = 6) {
  const like = `%${escapeLike(q)}%`;
  return db
    .select({ slug: listings.slug, title: listings.title, price: listings.price, categoryNameAr: rootCat.nameAr })
    .from(listings)
    .innerJoin(rootCat, eq(rootCat.id, listings.categoryId))
    .where(and(eq(listings.status, "active"), or(sql`${listings.title} ILIKE ${like}`, sql`${listings.searchVector} @@ websearch_to_tsquery('simple', ${q})`)))
    .orderBy(sql`similarity(${listings.title}, ${q}) desc`, desc(listings.bumpedAt))
    .limit(limit);
}
