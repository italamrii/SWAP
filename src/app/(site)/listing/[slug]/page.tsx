import { and, eq, sql } from "drizzle-orm";
import { ListingDetailView } from "@/components/listings/listing-detail-view";
import { PREVIEW_CATEGORIES, VISUAL_PREVIEW, previewListingDetail, previewRelated } from "@/lib/visual-preview";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { isStaff } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { cityLabel } from "@/lib/catalog/cities";
import { conditionLabel } from "@/lib/catalog/conditions";
import { db } from "@/lib/db";
import { listings, listingViews } from "@/lib/db/schema";
import { formatSAR } from "@/lib/format";
import { getCategoryTree } from "@/server/queries/categories";
import { getFavoriteIdSet, getListingBySlug, getSellerOtherListings, getSimilarListings } from "@/server/queries/listings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (VISUAL_PREVIEW) {
    const demo = previewListingDetail(slug);
    return { title: demo ? `${demo.listing.title} (نموذج)` : "إعلان غير متاح", robots: { index: false } };
  }
  const data = await getListingBySlug(slug);
  if (!data || !["active", "sold"].includes(data.listing.status)) return { title: "إعلان غير متاح", robots: { index: false } };
  const l = data.listing;
  const title = `${l.title} — ${formatSAR(l.price)}`;
  const description = `${conditionLabel(l.condition)} · ${cityLabel(l.city)}${l.acceptsSwap ? " · يقبل البدل" : ""}. ${l.description.slice(0, 140)}`;
  const image = l.coverImageUrl && !l.coverImageUrl.endsWith(".svg") ? l.coverImageUrl : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/listing/${l.slug}` },
    openGraph: { type: "website", title, description, url: `/listing/${l.slug}`, images: image ? [{ url: image }] : undefined },
    robots: l.status === "sold" ? { index: false } : undefined,
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  if (VISUAL_PREVIEW) {
    const demo = previewListingDetail(slug);
    if (!demo) notFound();
    const related = previewRelated(slug);
    return <ListingDetailView preview data={demo} similar={related.similar} more={related.more} savedIds={new Set()} saved={false} isOwner={false} signedIn={false} myListings={[]} categories={PREVIEW_CATEGORIES.map((c) => ({ id: c.id, nameAr: c.nameAr }))} />;
  }
  const [data, user] = await Promise.all([getListingBySlug(slug), getCurrentUser()]);
  if (!data) notFound();
  const { listing: l, category, seller } = data;
  const isOwner = user?.id === l.sellerId;
  const visible = ["active", "sold"].includes(l.status) || isOwner || isStaff(user);
  if (!visible || seller.status === "banned") notFound();

  if (!isOwner && l.status === "active") {
    after(async () => {
      const day = new Date().toISOString().slice(0, 10);
      await db.update(listings).set({ viewCount: sql`${listings.viewCount} + 1` }).where(eq(listings.id, l.id));
      await db.insert(listingViews).values({ listingId: l.id, day, views: 1 }).onConflictDoUpdate({ target: [listingViews.listingId, listingViews.day], set: { views: sql`${listingViews.views} + 1` } });
    });
  }

  const [similar, more, saved, tree, myListings] = await Promise.all([
    getSimilarListings(l.id, category.id),
    getSellerOtherListings(seller.id, l.id),
    getFavoriteIdSet(user?.id, [l.id]),
    getCategoryTree(),
    user && !isOwner && l.acceptsSwap
      ? db.select({ id: listings.id, title: listings.title }).from(listings).where(and(eq(listings.sellerId, user.id), eq(listings.status, "active"))).limit(30)
      : Promise.resolve([]),
  ]);
  const savedIds = await getFavoriteIdSet(user?.id, [...similar, ...more].map((x) => x.id));
  return (
    <ListingDetailView
      data={data}
      similar={similar}
      more={more}
      savedIds={savedIds}
      saved={saved.has(l.id)}
      isOwner={isOwner}
      signedIn={!!user}
      myListings={myListings}
      categories={tree.map((c) => ({ id: c.id, nameAr: c.nameAr }))}
    />
  );
}
