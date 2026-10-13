import { ArrowLeftRight, BadgeCheck, Check, ShieldCheck, Sparkles, Thermometer } from "lucide-react";
import Link from "next/link";
import { SearchBox } from "@/components/layout/search-box";
import { ListingImage } from "@/components/listings/listing-image";
import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";
import { cityLabel } from "@/lib/catalog/cities";
import type { ListingCardData } from "@/server/types";

const QUICK = [
  { href: "/browse?verified=1", label: "موثّق بتقرير فحص", icon: ShieldCheck },
  { href: "/browse?swap=1", label: "يقبل البدل", icon: ArrowLeftRight },
  { href: "/browse/gpus", label: "كروت شاشة" },
  { href: "/browse/laptops", label: "لابتوبات" },
  { href: "/browse?city=riyadh", label: "في الرياض" },
];

export function Hero({ spotlight }: { spotlight: ListingCardData | null }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-70" aria-hidden />
      <div className="pointer-events-none absolute -top-40 start-1/2 size-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="container-page relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground shadow-xs">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            سوق سعودي متخصص في الهاردوير المستعمل
          </span>
          <h1 className="mt-5 text-[34px] leading-[1.2] font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.15]">
            بيع وبدّل قطعك التقنية
            <br />
            <span className="text-primary">بثقة وتفاصيل واضحة.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground sm:text-lg">
            مواصفات منظّمة لكل قسم، وعروض بدل داخل المنصة، وتقارير فحص اختيارية تبيّن حالة الجهاز قبل ما تدفع ريال.
          </p>

          <div className="mt-8 max-w-xl">
            <SearchBox size="lg" />
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 text-[13px] font-medium text-muted-foreground transition hover:border-border-strong hover:text-foreground"
                >
                  {q.icon && <q.icon className="size-3.5" aria-hidden />}
                  {q.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/browse">تصفّح الإعلانات</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/account/listings/new">أضف إعلانك مجانًا</Link></Button>
          </div>
        </div>

        {spotlight && <HeroVisual listing={spotlight} />}
      </div>
    </section>
  );
}

/** A live listing rendered as a layered composition: card + report excerpt + swap offer. */
function HeroVisual({ listing }: { listing: ListingCardData }) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-label="مثال على إعلان موثّق في سواب">
      <Link href={`/listing/${listing.slug}`} className="group block rounded-2xl border border-border bg-surface p-3 shadow-card transition hover:shadow-pop">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2">
          <ListingImage src={listing.coverImageUrl} alt={listing.title} icon={listing.categoryIcon} priority sizes="(min-width: 1024px) 40vw, 90vw" />
          <span className="absolute top-3 end-3 inline-flex h-7 items-center gap-1 rounded-full bg-white/90 px-2.5 text-xs font-semibold text-primary-ink shadow-xs backdrop-blur dark:bg-black/60">
            <ShieldCheck className="size-3.5" /> فحص المنصة
          </span>
        </div>
        <div className="flex items-end justify-between gap-3 px-1 pt-3 pb-1">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{listing.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{cityLabel(listing.city)} · كالجديد</p>
          </div>
          <Price halalas={listing.price} size="lg" />
        </div>
      </Link>

      <div className="absolute bottom-24 end-2 w-60 rounded-xl border border-border bg-surface p-3.5 shadow-pop sm:-end-6 lg:-end-10">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary-soft text-primary-ink"><BadgeCheck className="size-3.5" /></span>
          تقرير الفحص
          <span className="ms-auto text-[11px] font-normal text-subtle-foreground">قبل يومين</span>
        </div>
        <ul className="mt-3 space-y-2 text-[12.5px] text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" />اجتاز اختبار الضغط (30 دقيقة)</li>
          <li className="flex items-center gap-2"><Thermometer className="size-3.5 text-primary" />الحرارة تحت الحمل <bdi className="font-semibold text-foreground">66°C</bdi></li>
          <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" />لم يُستخدم في التعدين</li>
        </ul>
      </div>

      <div className="absolute -top-6 start-2 hidden w-56 rounded-xl border border-swap/20 bg-surface p-3 shadow-pop sm:block lg:-start-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-swap-ink">
          <ArrowLeftRight className="size-3.5" /> عرض بدل جديد
        </div>
        <p className="mt-1.5 text-[13px] font-semibold"><bdi>RX 7900 GRE</bdi> + فرق <bdi>300</bdi> ر.س</p>
        <div className="mt-2.5 flex gap-1.5">
          <span className="flex-1 rounded-md bg-swap py-1 text-center text-[11px] font-semibold text-white">قبول</span>
          <span className="flex-1 rounded-md bg-surface-2 py-1 text-center text-[11px] font-semibold">نقاش</span>
        </div>
      </div>
      <Sparkles className="absolute -top-3 end-6 hidden size-5 text-primary/60 lg:block" aria-hidden />
    </div>
  );
}
