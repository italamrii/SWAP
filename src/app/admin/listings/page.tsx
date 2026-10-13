import { Flag, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListingModeration } from "@/components/admin/controls";
import { VerificationBadge } from "@/components/inspection/verification-badge";
import { ListingImage } from "@/components/listings/listing-image";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cityLabel } from "@/lib/catalog/cities";
import { LISTING_STATUS_META } from "@/lib/catalog/listing-status";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAdminListings } from "@/server/queries/admin";

export const metadata: Metadata = { title: "الإعلانات" };
const TABS = ["pending_review", "active", "hidden", "rejected", "sold", "all"];

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "pending_review", q } = await searchParams;
  const rows = await getAdminListings(TABS.includes(status) ? status : "pending_review", q?.slice(0, 60));
  return (
    <div className="space-y-6">
      <PageHeader title="الإعلانات" description="راجع الإعلانات الجديدة، وتعامل مع المخالفات." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <Link key={t} href={`/admin/listings?status=${t}`} className={cn("inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium", status === t ? "bg-graphite text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground")}>
              {t === "all" ? "الكل" : LISTING_STATUS_META[t].label}
            </Link>
          ))}
        </div>
        <form className="w-full sm:w-64"><input type="hidden" name="status" value={status} /><Input name="q" defaultValue={q} placeholder="بحث بالعنوان أو اسم المستخدم" aria-label="بحث" /></form>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={PackageCheck} title={status === "pending_review" ? "لا توجد إعلانات بانتظار المراجعة" : "لا توجد نتائج"} description={status === "pending_review" ? "عمل رائع! الطابور فاضي." : undefined} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <ul className="divide-y divide-border">
            {rows.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 gap-3">
                  <Link href={`/listing/${l.slug}`} target="_blank" className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg border border-border"><ListingImage src={l.coverImageUrl} alt="" sizes="96px" /></Link>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant={LISTING_STATUS_META[l.status].variant} size="sm">{LISTING_STATUS_META[l.status].label}</Badge>
                      <VerificationBadge level={l.verificationLevel} size="sm" />
                      {l.reports > 0 && <Badge variant="danger" size="sm"><Flag />{l.reports} بلاغ</Badge>}
                    </div>
                    <Link href={`/listing/${l.slug}`} target="_blank" className="line-clamp-1 text-sm font-semibold hover:underline">{l.title}</Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {l.category} · {cityLabel(l.city)} · <Link href={`/seller/${l.sellerUsername}`} className="hover:underline">{l.sellerName}</Link>{l.sellerTrusted && " ✓"} · {timeAgo(l.createdAt)}
                    </p>
                    {l.moderationNote && <p className="mt-1 text-xs text-danger">{l.moderationNote}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 lg:justify-end">
                  <Price halalas={l.price} size="sm" />
                  <ListingModeration listingId={l.id} status={l.status} verified={l.verificationLevel !== "unverified"} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
