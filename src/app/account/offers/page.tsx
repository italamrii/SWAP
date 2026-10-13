import { ArrowLeftRight, HandCoins, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListingImage } from "@/components/listings/listing-image";
import { OfferActions } from "@/components/messaging/offer-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/guards";
import { formatSAR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getOffersFor } from "@/server/queries/inbox";

export const metadata: Metadata = { title: "العروض والبدل" };

const STATUS: Record<string, { label: string; v: "warning" | "verified" | "danger" | "neutral" }> = {
  pending: { label: "بانتظار الرد", v: "warning" },
  accepted: { label: "مقبول", v: "verified" },
  rejected: { label: "مرفوض", v: "danger" },
  withdrawn: { label: "مسحوب", v: "neutral" },
  expired: { label: "منتهي", v: "neutral" },
};

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser("/account/offers");
  const [{ tab = "received" }, all] = await Promise.all([searchParams, getOffersFor(user.id)]);
  const items = all.filter((o) => o.direction === (tab === "sent" ? "sent" : "received"));
  const pendingReceived = all.filter((o) => o.direction === "received" && o.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader title="العروض والبدل" description="عروض الأسعار واقتراحات البدل على إعلاناتك، والعروض اللي قدّمتها." />
      <div className="inline-flex rounded-lg bg-surface-2 p-1" role="tablist">
        {[{ k: "received", l: "المستلمة", n: pendingReceived }, { k: "sent", l: "المرسلة", n: 0 }].map((t) => (
          <Link key={t.k} href={`/account/offers?tab=${t.k}`} role="tab" aria-selected={tab === t.k} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md px-4 text-sm font-medium", tab === t.k ? "bg-surface shadow-xs" : "text-muted-foreground")}>
            {t.l}{t.n > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{t.n}</span>}
          </Link>
        ))}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Inbox} title={tab === "sent" ? "ما قدّمت أي عروض بعد" : "لا توجد عروض على إعلاناتك"} description={tab === "sent" ? "من صفحة أي إعلان، اضغط «قدّم عرض سعر» أو «اقترح بدل»." : "فعّل «قابل للتفاوض» و«أقبل البدل» في إعلاناتك لتصلك عروض أكثر."} />
      ) : (
        <ul className="space-y-3">
          {items.map((o) => (
            <li key={o.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-center">
              <Link href={`/listing/${o.listing.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-28">
                <ListingImage src={o.listing.coverImageUrl} alt={o.listing.title} sizes="112px" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={o.type === "swap" ? "swap" : "info"} size="sm">{o.type === "swap" ? <><ArrowLeftRight />بدل</> : <><HandCoins />عرض سعر</>}</Badge>
                  <Badge variant={STATUS[o.status].v} size="sm">{STATUS[o.status].label}</Badge>
                  <span className="text-xs text-subtle-foreground">{timeAgo(o.createdAt)} · {o.direction === "received" ? `من ${o.counterpartName}` : `إلى ${o.counterpartName}`}</span>
                </div>
                <p className="mt-1.5 truncate text-sm font-semibold">{o.listing.title}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {o.type === "price" ? (
                    <>العرض <bdi className="font-bold text-foreground">{formatSAR(o.amount ?? 0)}</bdi> من أصل <bdi>{formatSAR(o.listing.price)}</bdi></>
                  ) : (
                    <>يعرض <bdi className="font-semibold text-foreground">{o.swap?.offeredTitle}</bdi>{o.swap?.cashDirection !== "none" && <> · {o.swap?.cashDirection === "buyer_pays" ? "+ يدفع" : "− يطلب"} <bdi>{formatSAR(o.swap?.cashAmount ?? 0)}</bdi></>}</>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {o.status === "pending" && <OfferActions offerId={o.id} direction={o.direction} />}
                <Link href={`/account/messages/${o.conversationId}`} className="text-[13px] font-semibold text-primary-ink hover:underline">المحادثة</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
