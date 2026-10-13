import { BadgeCheck, CalendarDays, Clock, MapPin, MessageSquareReply, Package, ShieldCheck, Store } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { ReportUserButton } from "@/components/listings/report-user-button";
import { formatResponseTime } from "@/components/listings/seller-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { cityLabel } from "@/lib/catalog/cities";
import { formatMonthYear } from "@/lib/format";
import { getFavoriteIdSet } from "@/server/queries/listings";
import { getSellerByUsername } from "@/server/queries/sellers";
import { VISUAL_PREVIEW, previewSeller } from "@/lib/visual-preview";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = VISUAL_PREVIEW ? previewSeller(username) : await getSellerByUsername(username);
  if (!data) return { title: "البائع غير موجود" };
  if (VISUAL_PREVIEW) return { title: `${data.seller.displayName} (ملف نموذجي)`, robots: { index: false } };
  return { title: `${data.seller.displayName} (@${data.seller.username})`, description: `إعلانات ${data.seller.displayName} في سواب: ${data.stats.active} إعلان نشط.`, alternates: { canonical: `/seller/${data.seller.username}` } };
}

export default async function SellerPage({ params }: Props) {
  const { username } = await params;
  const [data, user] = VISUAL_PREVIEW ? [previewSeller(username), null] : await Promise.all([getSellerByUsername(username), getCurrentUser()]);
  if (!data) notFound();
  const { seller, stats, items } = data;
  const saved = VISUAL_PREVIEW ? new Set<string>() : await getFavoriteIdSet(user?.id, items.map((i) => i.id));
  const active = items.filter((i) => i.status === "active");
  const sold = items.filter((i) => i.status === "sold");

  return (
    <div className="container-page pt-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50 mask-fade-b" aria-hidden />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={seller.displayName} src={seller.avatarUrl} size={80} className="ring-4 ring-surface" />
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                {seller.displayName}
                {seller.trusted && <BadgeCheck className="size-6 text-primary" aria-label="بائع موثوق" />}
              </h1>
              <p className="text-sm text-muted-foreground" dir="ltr">@{seller.username}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                {seller.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{cityLabel(seller.city)}</span>}
                <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />عضو منذ {formatMonthYear(seller.createdAt)}</span>
              </div>
            </div>
          </div>
          {VISUAL_PREVIEW ? <span className="self-start rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">ملف بائع نموذجي — شخصية غير حقيقية</span> : user?.id !== seller.id && <div className="md:self-start"><ReportUserButton userId={seller.id} signedIn={!!user} username={seller.username} /></div>}
        </div>
        {seller.bio && <p className="relative mt-5 max-w-2xl text-[15px] leading-relaxed">{seller.bio}</p>}
        <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Package, label: "إعلانات نشطة", value: stats.active },
            { icon: Store, label: "صفقات مكتملة", value: stats.sold + seller.completedDeals },
            { icon: MessageSquareReply, label: "نسبة الرد", value: seller.responseRate !== null ? `${seller.responseRate}%` : "جديد" },
            { icon: Clock, label: "سرعة الرد", value: formatResponseTime(seller.responseTimeMinutes) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background/60 p-3.5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><s.icon className="size-3.5" />{s.label}</dt>
              <dd className="mt-1 text-lg font-bold num">{s.value}</dd>
            </div>
          ))}
        </dl>
        {(seller.trusted || stats.verified > 0) && (
          <div className="relative mt-4 flex flex-wrap gap-2 text-[13px]">
            {seller.trusted && <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-medium text-primary-ink"><BadgeCheck className="size-4" />بائع موثوق — سجل تعامل جيد ومراجَع من سواب</span>}
            {stats.verified > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-3 py-1 font-medium text-info-ink"><ShieldCheck className="size-4" />{stats.verified} إعلان موثّق بتقرير فحص</span>}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-xl font-bold">الإعلانات النشطة <span className="text-base font-normal text-muted-foreground">({active.length})</span></h2>
        {active.length === 0 ? <EmptyState icon={Package} title="لا توجد إعلانات نشطة حاليًا" compact /> : (
          <ListingGrid>{active.map((l) => <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} showFavorite={!VISUAL_PREVIEW} />)}</ListingGrid>
        )}
      </section>
      {sold.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold">مُباع سابقًا</h2>
          <ListingGrid>{sold.map((l) => <ListingCard key={l.id} listing={l} />)}</ListingGrid>
        </section>
      )}
    </div>
  );
}
