import { ArrowLeftRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { WhySwap, VerificationExplainer, SwapShowcase, SafetySection, SellCta } from "@/components/home/sections";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { PREVIEW_CATEGORIES, PREVIEW_LISTINGS } from "@/lib/visual-preview";

export function PreviewHome() {
  const counts = new Map(PREVIEW_CATEGORIES.map((c) => [c.id, PREVIEW_LISTINGS.filter((l) => l.categorySlug === c.slug).length]));
  const verified = PREVIEW_LISTINGS.filter((l) => l.verificationLevel !== "unverified");
  const swaps = PREVIEW_LISTINGS.filter((l) => l.acceptsSwap);
  return (
    <>
      <Hero spotlight={PREVIEW_LISTINGS[0]} />
      <CategoryGrid categories={PREVIEW_CATEGORIES} counts={counts} />
      <section className="container-page pt-16 sm:pt-20">
        <SectionHeading eyebrow="معاينة توضيحية" title="إعلانات مختارة" description="بيانات نموذجية لتجربة تصميم سواب، وليست عروضًا حقيقية." href="/browse" />
        <ListingGrid>{PREVIEW_LISTINGS.slice(0, 8).map((listing) => <ListingCard key={listing.id} listing={listing} showFavorite={false} />)}</ListingGrid>
      </section>
      <WhySwap />
      <VerificationExplainer />
      <SwapShowcase />
      <section className="container-page pt-16 sm:pt-20">
        <SectionHeading eyebrow="تجربة عرض التوثيق" title="كيف تظهر شارة التحقق؟" description="هذه الشارات والأمثلة للتصميم فقط؛ لم تُفحص أي قطعة فعلية في المعاينة." href="/verification" />
        <ListingGrid>{verified.map((listing) => <ListingCard key={listing.id} listing={listing} showFavorite={false} />)}</ListingGrid>
      </section>
      <section className="container-page pt-16 sm:pt-20">
        <div className="flex items-center gap-2 text-swap-ink"><ArrowLeftRight className="size-5" /><span className="text-xs font-semibold">البدل في سواب</span></div>
        <SectionHeading title="إعلانات تقبل البدل" description="نماذج توضيحية لطريقة عرض عروض التبادل." href="/browse?swap=1" />
        <ListingGrid>{swaps.slice(0, 4).map((listing) => <ListingCard key={listing.id} listing={listing} showFavorite={false} />)}</ListingGrid>
      </section>
      <div className="container-page mt-16">
        <Link href="/browse" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary"><FlaskConical className="size-4" />استكشف معاينة الأقسام والإعلانات</Link>
      </div>
      <SafetySection />
      <SellCta />
    </>
  );
}
