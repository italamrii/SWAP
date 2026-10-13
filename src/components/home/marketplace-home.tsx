import { ArrowLeftRight, BadgeCheck, Camera, Clock, FileCheck2, Megaphone, Plus, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Button } from "@/components/ui/button";
import { compactNumber } from "@/lib/format";
import type { CategoryNode } from "@/server/queries/categories";
import type { ListingCardData } from "@/server/types";
import { MarketSection } from "./market-section";
import { QuickChips } from "./quick-chips";

export interface MarketplaceHomeData {
  categories: CategoryNode[];
  counts: Map<number, number>;
  latest: ListingCardData[];
  verified: ListingCardData[];
  swaps: ListingCardData[];
  spotlights: { category: CategoryNode; items: ListingCardData[] }[];
  stats: { active: number; verified: number; swap: number };
  banner?: { title: string; body: string | null; href: string | null } | null;
  saved?: Set<string>;
  /** Visual preview: no favorites/transactions, sample-data labels. */
  preview?: boolean;
}

export function MarketplaceHome(d: MarketplaceHomeData) {
  const saved = d.saved ?? new Set<string>();
  const card = (l: ListingCardData, i: number) => <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} priority={i < 4} showFavorite={!d.preview} />;

  return (
    <>
      {d.banner && !d.preview && (
        <div className="border-b border-border bg-primary-soft/60">
          <p className="container-page flex items-center justify-center gap-2 py-1.5 text-center text-[12.5px] text-primary-ink">
            <Megaphone className="size-3.5 shrink-0" aria-hidden />
            <span className="font-semibold">{d.banner.title}</span>
            {d.banner.body && <span className="hidden sm:inline">— {d.banner.body}</span>}
            {d.banner.href && <Link href={d.banner.href} className="font-semibold underline underline-offset-4">التفاصيل</Link>}
          </p>
        </div>
      )}

      {/* Compact discovery strip — listings start right below it. */}
      <section className="border-b border-border bg-surface" aria-labelledby="home-h">
        <div className="container-page flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between lg:py-5">
          <div className="min-w-0">
            <h1 id="home-h" className="text-[19px] font-bold tracking-tight sm:text-[22px]">سوق الكمبيوتر والقطع المستعملة في السعودية</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
              <span><b className="text-foreground num">{compactNumber(d.stats.active)}</b> إعلان نشط</span>
              <span className="inline-flex items-center gap-1"><BadgeCheck className="size-3.5 text-primary" aria-hidden /><b className="text-foreground num">{d.stats.verified}</b> موثّق بتقرير فحص</span>
              <span className="inline-flex items-center gap-1"><ArrowLeftRight className="size-3.5 text-swap" aria-hidden /><b className="text-foreground num">{d.stats.swap}</b> يقبل البدل</span>
              {d.preview && <span className="rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">أرقام نموذجية</span>}
            </p>
            <div className="mt-3"><Suspense fallback={<div className="h-8" />}><QuickChips /></Suspense></div>
          </div>
          {!d.preview && (
            <div className="hidden shrink-0 items-center gap-3 rounded-xl border border-border bg-background p-3 lg:flex">
              <div className="text-[13px]"><p className="font-semibold">عندك قطعة ما تستخدمها؟</p><p className="text-muted-foreground">أضف إعلانك مجانًا خلال 3 دقائق</p></div>
              <Button asChild size="sm"><Link href="/account/listings/new"><Plus />أضف إعلان</Link></Button>
            </div>
          )}
        </div>
      </section>

      {/* Popular categories with live counts — one compact row */}
      <nav aria-label="تسوّق حسب القسم" className="container-page pt-3">
        <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
          {d.categories.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link href={`/browse/${c.slug}`} className="group inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface ps-1.5 pe-3 text-[13px] font-semibold transition hover:border-primary/40">
                <span className="flex size-7 items-center justify-center rounded-md bg-surface-2 transition group-hover:bg-primary-soft group-hover:text-primary-ink"><CategoryIcon icon={c.icon} className="size-4" /></span>
                {c.nameAr}
                <span className="rounded bg-surface-2 px-1.5 text-[11px] font-medium text-muted-foreground num">{d.counts.get(c.id) ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <MarketSection className="pt-5 sm:pt-6" id="latest" title="أحدث الإعلانات" icon={<Clock className="size-[18px] text-primary" aria-hidden />} note={d.preview ? "إعلانات نموذجية لتجربة التصميم" : "وصلت للتو من مختلف مدن المملكة"} href="/browse?sort=newest">
        <ListingGrid>{d.latest.map(card)}</ListingGrid>
      </MarketSection>

      {d.verified.length > 0 && (
        <MarketSection id="verified" tone="verified" title="إعلانات موثّقة بتقرير فحص" icon={<ShieldCheck className="size-[18px]" aria-hidden />} note={d.preview ? "شارات توضيحية — لم تُفحص أي قطعة في المعاينة" : "تقارير راجعها فريق سواب — ليست ضمانًا مطلقًا"} href="/browse?verified=1">
          <ListingGrid>{d.verified.map(card)}</ListingGrid>
        </MarketSection>
      )}

      {d.swaps.length > 0 && (
        <MarketSection id="swaps" tone="swap" title="تقبل البدل" icon={<ArrowLeftRight className="size-[18px]" aria-hidden />} note="أصحابها منفتحون على عروض بدل مع فرق سعر" href="/browse?swap=1">
          <ListingGrid>{d.swaps.map(card)}</ListingGrid>
        </MarketSection>
      )}

      {d.spotlights.map(({ category, items }) => (
        <MarketSection key={category.slug} id={`cat-${category.slug}`} title={category.nameAr} icon={<CategoryIcon icon={category.icon} className="size-[18px] text-muted-foreground" />} note={category.descriptionAr ?? undefined} href={`/browse/${category.slug}`} linkLabel={`كل ${category.nameAr}`}>
          <ListingGrid>{items.map(card)}</ListingGrid>
        </MarketSection>
      ))}

      {/* Compact inspection explainer */}
      <section aria-labelledby="insp-h" className="container-page pt-10">
        <div className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 id="insp-h" className="flex items-center gap-2 text-[16px] font-bold"><ShieldCheck className="size-5 text-primary" aria-hidden />تقارير الفحص في سواب</h2>
            <ol className="mt-3 grid gap-3 text-[13px] sm:grid-cols-3">
              {[
                { icon: ScanSearch, t: "البائع يفحص جهازه", d: "نموذج فحص منظّم وأدلة من أدوات معروفة" },
                { icon: Camera, t: "صورة مع كود التحقق", d: "كود فريد بجانب الجهاز يثبت الحيازة" },
                { icon: FileCheck2, t: "مراجعة الفريق", d: "مستوى توثيق حسب الأدلة — ليس ضمانًا" },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[12px] font-bold text-primary-ink num">{i + 1}</span>
                  <span><b className="flex items-center gap-1 font-semibold"><s.icon className="size-3.5 text-muted-foreground" aria-hidden />{s.t}</b><span className="text-muted-foreground">{s.d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/verification">كيف يعمل التوثيق</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/safety">نصائح الأمان</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
