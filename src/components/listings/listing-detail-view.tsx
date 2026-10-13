import { AlertTriangle, ArrowLeftRight, CalendarClock, Eye, FlaskConical, Info, MapPin, ShieldAlert, ShieldCheck, TrendingDown } from "lucide-react";
import Link from "next/link";
import { InspectionReport } from "@/components/inspection/inspection-report";
import { VerificationBadge } from "@/components/inspection/verification-badge";
import { BidiText } from "@/components/shared/bidi-text";
import { Price } from "@/components/shared/price";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cityLabel } from "@/lib/catalog/cities";
import { CONDITIONS } from "@/lib/catalog/conditions";
import { APP_URL } from "@/lib/env";
import { daysSince, formatDate, formatSAR, timeAgo } from "@/lib/format";
import type { ListingDetail } from "@/server/queries/listings";
import type { ListingCardData } from "@/server/types";
import { ChevronLeft } from "lucide-react";
import { ImageGallery } from "./image-gallery";
import { ListingActions, MobileActionBar } from "./listing-actions";
import { ListingCard, ListingGrid } from "./listing-card";
import { OwnerPanel } from "./owner-panel";
import { SellerCard } from "./seller-card";
import { SpecTable } from "./spec-table";

export interface ListingDetailViewProps {
  data: ListingDetail;
  similar: ListingCardData[];
  more: ListingCardData[];
  savedIds: Set<string>;
  saved: boolean;
  isOwner: boolean;
  signedIn: boolean;
  myListings: { id: string; title: string }[];
  categories: { id: number; nameAr: string }[];
  /** Visual preview: sample data, transactional actions disabled. */
  preview?: boolean;
}

/** Shared listing page body for real and visual-preview data. */
export function ListingDetailView({ data, similar, more, savedIds, saved, isOwner, signedIn, myListings, categories, preview }: ListingDetailViewProps) {
  const { listing: l, category, subcategory, seller, images, inspection, sellerStats, lastPriceChange } = data;
  const priceDropped = lastPriceChange && lastPriceChange.newPrice < lastPriceChange.oldPrice && daysSince(lastPriceChange.createdAt) < 14;
  const condition = CONDITIONS.find((c) => c.value === l.condition);
  const actionProps = {
    listing: { id: l.id, slug: l.slug, title: l.title, price: l.price, isNegotiable: l.isNegotiable, acceptsSwap: l.acceptsSwap, swapDetails: l.swapDetails },
    signedIn,
    saved,
    sellerPhone: seller.showPhone && seller.phone && signedIn ? seller.phone : null,
    myListings,
    categories,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: l.title,
    description: l.description.slice(0, 500),
    category: category.nameAr,
    image: images.map((i) => (i.url.startsWith("http") ? i.url : `${APP_URL}${i.url}`)),
    offers: {
      "@type": "Offer",
      price: (l.price / 100).toFixed(0),
      priceCurrency: "SAR",
      availability: l.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: l.condition === "new" ? "https://schema.org/NewCondition" : l.condition === "for_parts" ? "https://schema.org/DamagedCondition" : "https://schema.org/UsedCondition",
      url: `${APP_URL}/listing/${l.slug}`,
      seller: { "@type": "Person", name: seller.displayName },
    },
  };

  return (
    <div className="container-page pt-4 pb-28 sm:pt-5 lg:max-w-[84rem] lg:pb-0">
      {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <nav aria-label="مسار التنقل" className="mb-5 flex items-center gap-1.5 overflow-hidden text-[13px] text-muted-foreground">
        <Link href="/" className="shrink-0 hover:text-foreground">الرئيسية</Link>
        <span aria-hidden>/</span>
        <Link href={`/browse/${category.slug}`} className="shrink-0 hover:text-foreground">{category.nameAr}</Link>
        {subcategory && (<><span aria-hidden>/</span><Link href={`/browse/${category.slug}?sub=${subcategory.slug}`} className="shrink-0 hover:text-foreground">{subcategory.nameAr}</Link></>)}
        <span aria-hidden>/</span>
        <span className="truncate text-foreground">{l.title}</span>
      </nav>

      {l.status !== "active" && (
        <Alert variant={l.status === "sold" ? "neutral" : l.status === "rejected" ? "danger" : "warning"} className="mb-5">
          <Info />
          <div>
            {l.status === "sold" && <>تم بيع هذه القطعة {l.soldAt && timeAgo(l.soldAt)}. تصفّح <Link className="font-semibold underline" href={`/browse/${category.slug}`}>إعلانات مشابهة</Link>.</>}
            {l.status === "pending_review" && <>الإعلان قيد المراجعة ولن يظهر للمتصفحين حتى يعتمده فريق سواب — غالبًا خلال ساعات.</>}
            {l.status === "hidden" && <>الإعلان مخفي حاليًا ولا يظهر للمتصفحين.</>}
            {l.status === "rejected" && <>لم يُعتمد الإعلان{l.moderationNote ? `: ${l.moderationNote}` : "."} عدّله وأعد إرساله.</>}
            {l.status === "draft" && <>مسودة غير منشورة.</>}
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
        {/* Main column */}
        <div className="min-w-0">
          <ImageGallery
            images={images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
            title={l.title}
            icon={category.icon}
            overlay={
              <div className="pointer-events-none absolute top-3 start-3 flex flex-wrap gap-1.5">
                <VerificationBadge level={l.verificationLevel} variant="glass" />
                {l.acceptsSwap && <span className="inline-flex h-6 items-center gap-1 rounded-full bg-swap px-2 text-xs font-semibold text-white"><ArrowLeftRight className="size-3.5" />يقبل البدل</span>}
              </div>
            }
          />

          {/* Mobile summary (desktop shows this in the aside) */}
          <div className="mt-5 lg:hidden">
            <TitleBlock l={l} categoryName={category.nameAr} conditionLabel={condition?.label ?? l.condition} />
            <div className="mt-3 flex items-center gap-3">
              <Price halalas={l.price} size="xl" />
              {priceDropped && <PriceDrop from={lastPriceChange!.oldPrice} />}
            </div>
          </div>

          <section className="mt-8" aria-labelledby="specs-h">
            <h2 id="specs-h" className="mb-4 text-lg font-bold">المواصفات والحالة</h2>
            <SpecTable
              schemaKey={category.schemaKey}
              specs={l.specs}
              extraRows={[{ label: "الحالة العامة", value: condition ? `${condition.label} — ${condition.hint}` : l.condition }]}
            />
          </section>

          <section className="mt-10" aria-labelledby="desc-h">
            <h2 id="desc-h" className="mb-3 text-lg font-bold">الوصف</h2>
            <div className="rounded-xl border border-border bg-surface p-5 text-[15px] leading-[1.9] whitespace-pre-line text-pretty"><BidiText text={l.description} /></div>
            {l.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.tags.map((t) => <Link key={t} href={`/browse?q=${encodeURIComponent(t)}`} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">#{t}</Link>)}
              </div>
            )}
          </section>

          {l.acceptsSwap && (
            <section className="mt-8 rounded-xl border border-swap/25 bg-swap-soft p-5">
              <h2 className="flex items-center gap-2 font-bold text-swap-ink"><ArrowLeftRight className="size-5" />البائع منفتح على البدل</h2>
              <p className="mt-2 text-sm leading-relaxed">{l.swapDetails ? <BidiText text={l.swapDetails} /> : "لم يحدد البائع قطعة معيّنة — اقترح اللي عندك."}</p>
            </section>
          )}

          <section className="mt-10" id="inspection" aria-labelledby="insp-h">
            <h2 id="insp-h" className="mb-4 flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="size-5 text-primary" />
              التوثيق وتقرير الفحص
            </h2>
            {inspection ? (
              <>
                {preview && (
                  <Alert variant="warning" className="mb-3"><FlaskConical /><div>تقرير نموذجي لعرض التصميم فقط — لم تُفحص هذه القطعة، ولا يمثل شهادة فحص.</div></Alert>
                )}
                <InspectionReport inspection={inspection} />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-warning/40 bg-warning-soft/50 p-5">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                  <div>
                    <h3 className="font-semibold">هذا الإعلان بدون تقرير فحص</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      لا يعني ذلك وجود مشكلة، لكن ننصحك بطلب صور إضافية أو فيديو للقطعة وهي تعمل، وفحصها بنفسك قبل الدفع.
                    </p>
                    <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-1.5 text-[13px] text-muted-foreground sm:grid-cols-2">
                      <li>• اطلب لقطة من CrystalDiskInfo أو HWiNFO</li>
                      <li>• شغّل اختبار ضغط لمدة 10 دقائق</li>
                      <li>• تأكد من الرقم التسلسلي والفاتورة</li>
                      <li>• قابل البائع في مكان عام</li>
                    </ul>
                    {isOwner && <Link href={`/account/verification/${l.id}`} className="mt-4 inline-block text-sm font-semibold text-primary-ink underline underline-offset-4">أضف تقرير فحص لإعلانك</Link>}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mt-10 rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-warning" />قبل ما تشتري</h2>
            <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>• لا تحوّل أي مبلغ قبل المعاينة.</li>
              <li>• قابل البائع في مكان عام ومزدحم.</li>
              <li>• شغّل القطعة وتأكد من المواصفات.</li>
              <li>• أبقِ التواصل داخل سواب.</li>
            </ul>
            <Link href="/safety" className="mt-3 inline-block text-[13px] font-semibold text-primary-ink hover:underline">دليل الشراء الآمن</Link>
          </section>
        </div>

        {/* Aside */}
        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <div className="hidden rounded-2xl border border-border bg-surface p-5 shadow-card lg:block">
            <TitleBlock l={l} categoryName={category.nameAr} conditionLabel={condition?.label ?? l.condition} />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Price halalas={l.price} size="xl" />
              {priceDropped && <PriceDrop from={lastPriceChange!.oldPrice} />}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">{l.isNegotiable ? "السعر قابل للتفاوض" : "السعر نهائي غير قابل للتفاوض"}</p>
            <div className="mt-5">
              {isOwner ? (
                <OwnerPanel listing={{ id: l.id, status: l.status, viewCount: l.viewCount, favoriteCount: l.favoriteCount, verificationLevel: l.verificationLevel }} />
              ) : l.status === "active" ? (
                preview ? <PreviewActionsNotice /> : <ListingActions {...actionProps} />
              ) : null}
            </div>
          </div>
          {isOwner && <div className="rounded-2xl border border-border bg-surface p-5 lg:hidden"><OwnerPanel listing={{ id: l.id, status: l.status, viewCount: l.viewCount, favoriteCount: l.favoriteCount, verificationLevel: l.verificationLevel }} /></div>}
          <SellerCard seller={seller} stats={sellerStats} />
          {inspection && (
            <a href="#inspection" className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary-soft/50 p-4 transition hover:border-primary/50">
              <ShieldCheck className="size-6 shrink-0 text-primary" />
              <div className="text-[13px]">
                <p className="font-semibold text-primary-ink">يتوفر تقرير فحص لهذا الإعلان</p>
                <p className="text-muted-foreground">فُحص {timeAgo(inspection.inspectedAt)} · اطّلع على التفاصيل</p>
              </div>
            </a>
          )}
        </aside>
      </div>

      {more.length > 0 && (
        <RelatedRow id="more" title={`إعلانات أخرى من ${seller.displayName}`} href={`/seller/${seller.username}`}>
          <ListingGrid>{more.map((x) => <ListingCard key={x.id} listing={x} saved={savedIds.has(x.id)} showFavorite={!preview} />)}</ListingGrid>
        </RelatedRow>
      )}
      {similar.length > 0 && (
        <RelatedRow id="similar" title="إعلانات مشابهة" href={`/browse/${category.slug}`}>
          <ListingGrid>{similar.map((x) => <ListingCard key={x.id} listing={x} saved={savedIds.has(x.id)} showFavorite={!preview} />)}</ListingGrid>
        </RelatedRow>
      )}

      {!isOwner && l.status === "active" && !preview && <MobileActionBar {...actionProps} />}
    </div>
  );
}


function TitleBlock({ l, categoryName, conditionLabel }: { l: { title: string; city: string; publishedAt: Date | null; createdAt: Date; viewCount: number; verificationLevel: Parameters<typeof VerificationBadge>[0]["level"]; isNegotiable: boolean }; categoryName: string; conditionLabel: string }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{categoryName}</Badge>
        <Badge variant="neutral">{conditionLabel}</Badge>
        <VerificationBadge level={l.verificationLevel} />
      </div>
      <h1 className="mt-3 text-xl font-bold leading-snug tracking-tight text-balance sm:text-2xl"><BidiText text={l.title} /></h1>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="size-3.5" />{cityLabel(l.city)}</span>
        <span className="flex items-center gap-1" title={formatDate(l.publishedAt ?? l.createdAt)}><CalendarClock className="size-3.5" />{timeAgo(l.publishedAt ?? l.createdAt)}</span>
        <span className="flex items-center gap-1"><Eye className="size-3.5" />{l.viewCount} مشاهدة</span>
      </div>
    </div>
  );
}

function PriceDrop({ from }: { from: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary-ink">
      <TrendingDown className="size-3.5" />
      نزل من <bdi className="line-through decoration-1 opacity-70">{formatSAR(from)}</bdi>
    </span>
  );
}

function RelatedRow({ id, title, href, children }: { id: string; title: string; href: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="mt-12">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id={`${id}-h`} className="text-[17px] font-bold sm:text-lg">{title}</h2>
        <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-primary-ink hover:underline">عرض الكل<ChevronLeft className="size-4" aria-hidden /></Link>
      </div>
      {children}
    </section>
  );
}

function PreviewActionsNotice() {
  return (
    <div className="space-y-2.5" data-testid="preview-actions">
      <div className="grid gap-2 opacity-60" aria-hidden>
        <div className="flex h-12 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">راسل البائع</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex h-12 items-center justify-center rounded-lg border border-border-strong text-sm font-semibold">قدّم عرض سعر</div>
          <div className="flex h-12 items-center justify-center rounded-lg border border-swap/30 bg-swap-soft text-sm font-semibold text-swap-ink">اقترح بدل</div>
        </div>
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
        <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
        المراسلة والعروض والبدل معطّلة في معاينة التصميم. هذه أزرار توضيحية فقط.
      </p>
    </div>
  );
}
