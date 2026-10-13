import { ArrowLeftRight, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ListingImage } from "@/components/listings/listing-image";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { Price } from "@/components/shared/price";
import { VerificationBadge } from "@/components/inspection/verification-badge";
import { cityLabel } from "@/lib/catalog/cities";
import { conditionLabel } from "@/lib/catalog/conditions";
import { PREVIEW_LISTINGS } from "@/lib/visual-preview";

export function PreviewDetail({ slug }: { slug: string }) {
  const listing = PREVIEW_LISTINGS.find((l) => l.slug === slug);
  if (!listing) return <div className="container-page py-24 text-center"><h1 className="text-2xl font-bold">الإعلان غير موجود</h1><Link href="/browse" className="mt-5 inline-block text-primary-ink underline">تصفح الإعلانات التجريبية</Link></div>;
  return (
    <div className="container-page pt-6 pb-20">
      <nav className="mb-6 text-sm text-muted-foreground"><Link href="/browse">الإعلانات</Link> / <Link href={`/browse/${listing.categorySlug}`}>{listing.categoryNameAr}</Link></nav>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-2"><ListingImage src={listing.coverImageUrl} icon={listing.categoryIcon} alt={listing.title} /></div>
          <h2 className="mt-8 text-xl font-bold">الوصف والمواصفات</h2>
          <div className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm leading-8"><p>هذا إعلان توضيحي يبيّن شكل صفحة تفاصيل الإعلان في سواب. لا يمثل منتجًا معروضًا للبيع.</p><p className="mt-3">في النسخة الفعلية سيظهر وصف البائع، مواصفات القطعة المنظمة، صورها، تقرير الفحص، ومعلومات البائع.</p></div>
          <h2 className="mt-9 flex items-center gap-2 text-xl font-bold"><ShieldCheck className="size-5" />تقرير الفحص</h2>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm leading-7">نموذج بصري لمكان التقرير، وليس شهادة فحص فعلية. في النسخة الحية ستُعرض التقارير المعتمدة فقط.</div>
        </div>
        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-surface-2 px-2 py-1 text-xs">{listing.categoryNameAr}</span><VerificationBadge level={listing.verificationLevel} /></div>
            <h1 className="mt-4 text-2xl font-bold">{listing.title}</h1>
            <div className="mt-4"><Price halalas={listing.price} size="xl" /></div>
            <p className="mt-3 text-sm text-muted-foreground"><MapPin className="me-1 inline size-4" />{cityLabel(listing.city)} · {conditionLabel(listing.condition)}</p>
            {listing.acceptsSwap && <p className="mt-3 flex items-center gap-2 text-sm text-swap-ink"><ArrowLeftRight className="size-4" />يقبل البدل</p>}
            <div className="mt-6 rounded-xl bg-surface-2 p-4 text-sm leading-7">المحادثات، الشراء، والبدل معطلة في المعاينة البصرية حتى تُربط قاعدة البيانات.</div>
            <Link href="/browse" className="mt-5 block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">عودة للإعلانات</Link>
          </div>
        </aside>
      </div>
      <h2 className="mt-14 mb-6 text-xl font-bold">إعلانات نموذجية أخرى</h2>
      <ListingGrid>{PREVIEW_LISTINGS.filter((x) => x.id !== listing.id).slice(0, 4).map((l) => <ListingCard key={l.id} listing={l} showFavorite={false} />)}</ListingGrid>
    </div>
  );
}
