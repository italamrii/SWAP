import { ArrowLeftRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { PREVIEW_CATEGORIES, PREVIEW_LISTINGS } from "@/lib/visual-preview";

type Params = Record<string, string | string[] | undefined>;
export function PreviewBrowse({ params, categorySlug }: { params: Params; categorySlug?: string }) {
  const category = PREVIEW_CATEGORIES.find((c) => c.slug === categorySlug);
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  let results = PREVIEW_LISTINGS.filter((l) =>
    (!categorySlug || l.categorySlug === categorySlug) &&
    (!q || l.title.toLowerCase().includes(q) || l.categoryNameAr.includes(q)) &&
    (params.swap !== "1" || l.acceptsSwap) &&
    (params.verified !== "1" || l.verificationLevel !== "unverified") &&
    (!params.city || l.city === params.city)
  );
  if (params.sort === "price_asc") results = results.sort((a, b) => a.price - b.price);
  if (params.sort === "price_desc") results = results.sort((a, b) => b.price - a.price);
  return (
    <div className="container-page pt-6 sm:pt-8">
      <nav className="mb-5 flex gap-2 text-sm text-muted-foreground"><Link href="/">الرئيسية</Link><span>/</span><Link href="/browse">تصفح</Link>{category && <><span>/</span><span className="text-foreground">{category.nameAr}</span></>}</nav>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
        <div><h1 className="text-2xl font-bold sm:text-3xl">{category?.nameAr ?? (q ? "نتائج البحث" : "كل الإعلانات")}</h1><p className="mt-2 text-sm text-muted-foreground">{results.length} إعلان تجريبي — للتصميم فقط</p></div>
        <form action="/browse" className="flex min-w-[220px] max-w-md flex-1 gap-2 rounded-xl border border-border bg-surface p-2"><input name="q" defaultValue={q} className="min-w-0 flex-1 bg-transparent px-2 outline-none" aria-label="البحث في المعاينة" placeholder="ابحث عن جهاز أو قطعة…" /><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">بحث</button></form>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/browse" className="rounded-full border border-border px-4 py-2 text-sm">كل الأقسام</Link>
        {PREVIEW_CATEGORIES.map((c) => <Link key={c.id} href={`/browse/${c.slug}`} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm ${categorySlug === c.slug ? "border-primary bg-primary-soft text-primary-ink" : "border-border bg-surface"}`}><CategoryIcon icon={c.icon} className="size-4" />{c.nameAr}</Link>)}
      </div>
      <div className="my-7 flex flex-wrap gap-2">
        <Link href="/browse?swap=1" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm"><ArrowLeftRight className="size-4" />يقبل البدل</Link>
        <Link href="/browse?verified=1" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm"><ShieldCheck className="size-4" />تقرير فحص</Link>
        <Link href="/browse?sort=price_asc" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm">الأقل سعرًا</Link>
        <Link href="/browse?sort=price_desc" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm">الأعلى سعرًا</Link>
      </div>
      {results.length ? <ListingGrid>{results.map((listing) => <ListingCard key={listing.id} listing={listing} showFavorite={false} />)}</ListingGrid> : <div className="rounded-xl border border-border bg-surface p-12 text-center text-muted-foreground">ما فيه إعلانات نموذجية تطابق هذا البحث. <Link href="/browse" className="font-semibold text-primary-ink underline">اعرض الكل</Link></div>}
    </div>
  );
}
