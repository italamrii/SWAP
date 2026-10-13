import { and, asc, eq } from "drizzle-orm";
import { MarketplaceHome } from "@/components/home/marketplace-home";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { APP_URL, SITE_DESCRIPTION } from "@/lib/env";
import { PREVIEW_CATEGORIES, VISUAL_PREVIEW, previewHomeData, previewSearch } from "@/lib/visual-preview";
import { parseBrowseParams } from "@/lib/browse-params";
import { getCategoryCounts, getCategoryTree } from "@/server/queries/categories";
import { getFavoriteIdSet, getLatestListings, getMarketplaceStats } from "@/server/queries/listings";

export const dynamic = "force-dynamic";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "سواب",
  alternateName: "SWAP",
  url: APP_URL,
  description: SITE_DESCRIPTION,
  potentialAction: { "@type": "SearchAction", target: `${APP_URL}/browse?q={search_term_string}`, "query-input": "required name=search_term_string" },
};

function JsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export default async function HomePage() {
  if (VISUAL_PREVIEW) {
    const p = previewHomeData();
    const spotlights = topCategories(PREVIEW_CATEGORIES, p.counts).map((category) => ({ category, items: previewSearch({ ...parseBrowseParams({}), categorySlug: category.slug }).items.slice(0, 6) }));
    return (
      <>
        <JsonLd />
        <MarketplaceHome {...p} spotlights={spotlights} preview />
      </>
    );
  }

  const [user, categories, counts, stats, latest, verified, swaps, banner] = await Promise.all([
    getCurrentUser(),
    getCategoryTree(),
    getCategoryCounts(),
    getMarketplaceStats(),
    getLatestListings(12),
    getLatestListings(6, { verifiedOnly: true }),
    getLatestListings(6, { swapOnly: true }),
    db.select().from(banners).where(and(eq(banners.placement, "home_top"), eq(banners.isActive, true))).orderBy(asc(banners.sortOrder)).limit(1),
  ]);
  const spotlights = await Promise.all(topCategories(categories, counts).map(async (category) => ({ category, items: await getLatestListings(6, { categoryId: category.id }) })));
  const all = [...latest, ...verified, ...swaps, ...spotlights.flatMap((s) => s.items)];
  const saved = await getFavoriteIdSet(user?.id, [...new Set(all.map((l) => l.id))]);

  return (
    <>
      <JsonLd />
      <MarketplaceHome categories={categories} counts={counts} stats={stats} latest={latest} verified={verified} swaps={swaps} spotlights={spotlights} banner={banner[0] ?? null} saved={saved} />
    </>
  );
}

/** The two busiest categories get their own rows. */
function topCategories<T extends { id: number }>(categories: T[], counts: Map<number, number>) {
  return [...categories].filter((c) => (counts.get(c.id) ?? 0) >= 3).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)).slice(0, 2);
}
