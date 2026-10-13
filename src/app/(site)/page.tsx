import { and, asc, eq } from "drizzle-orm";
import { Megaphone } from "lucide-react";
import Link from "next/link";
import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { SafetySection, SellCta, SwapShowcase, VerificationExplainer, WhySwap } from "@/components/home/sections";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { APP_URL, SITE_DESCRIPTION } from "@/lib/env";
import { getCategoryCounts, getCategoryTree } from "@/server/queries/categories";
import { getFavoriteIdSet, getLatestListings } from "@/server/queries/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, categories, counts, verified, latest, swaps, banner] = await Promise.all([
    getCurrentUser(),
    getCategoryTree(),
    getCategoryCounts(),
    getLatestListings(8, { verifiedOnly: true }),
    getLatestListings(8),
    getLatestListings(4, { swapOnly: true }),
    db.select().from(banners).where(and(eq(banners.placement, "home_top"), eq(banners.isActive, true))).orderBy(asc(banners.sortOrder)).limit(1),
  ]);
  const saved = await getFavoriteIdSet(user?.id, [...verified, ...latest, ...swaps].map((l) => l.id));
  const spotlight = verified.find((l) => l.verificationLevel === "platform_checked") ?? verified[0] ?? latest[0] ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "سواب",
    alternateName: "SWAP",
    url: APP_URL,
    description: SITE_DESCRIPTION,
    potentialAction: { "@type": "SearchAction", target: `${APP_URL}/browse?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {banner[0] && (
        <div className="border-b border-border bg-primary-soft/60">
          <div className="container-page flex items-center justify-center gap-2 py-2 text-center text-[13px] text-primary-ink">
            <Megaphone className="size-4 shrink-0" aria-hidden />
            <span className="font-semibold">{banner[0].title}</span>
            {banner[0].body && <span className="hidden sm:inline">— {banner[0].body}</span>}
            {banner[0].href && <Link href={banner[0].href} className="font-semibold underline underline-offset-4">التفاصيل</Link>}
          </div>
        </div>
      )}
      <Hero spotlight={spotlight} />
      <CategoryGrid categories={categories} counts={counts} />

      {verified.length > 0 && (
        <section className="container-page pt-16 sm:pt-20">
          <SectionHeading
            eyebrow="موثّقة بتقارير فحص"
            title="اشترِ وأنت عارف وش تشتري"
            description="إعلانات أرفق أصحابها تقارير فحص وراجعها فريق سواب."
            href="/browse?verified=1"
          />
          <ListingGrid>
            {verified.slice(0, 4).map((l, i) => <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} priority={i < 2} />)}
          </ListingGrid>
        </section>
      )}

      <section className="container-page pt-16 sm:pt-20">
        <SectionHeading title="أحدث الإعلانات" description="قطع وصلت للتو من بائعين في مختلف مدن المملكة." href="/browse" />
        <ListingGrid>
          {latest.map((l) => <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} />)}
        </ListingGrid>
      </section>

      <WhySwap />
      <VerificationExplainer />
      <SwapShowcase />

      {swaps.length > 0 && (
        <section className="container-page pt-16 sm:pt-20">
          <SectionHeading eyebrow="مفتوحة للبدل" title="أصحابها يدوّرون على بدل" href="/browse?swap=1" />
          <ListingGrid>
            {swaps.map((l) => <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} />)}
          </ListingGrid>
        </section>
      )}

      <SafetySection />
      <SellCta />
    </>
  );
}
