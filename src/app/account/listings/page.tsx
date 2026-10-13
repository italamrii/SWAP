import { PackageOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MyListingRow } from "@/components/account/my-listing-row";
import { LISTING_STATUS_META as STATUS_META } from "@/lib/catalog/listing-status";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { getMyListings } from "@/server/queries/account";

export const metadata: Metadata = { title: "إعلاناتي" };

const TABS = ["all", "active", "pending_review", "sold", "hidden", "rejected"] as const;

export default async function MyListingsPage({ searchParams }: { searchParams: Promise<{ status?: string; created?: string }> }) {
  const user = await requireUser("/account/listings");
  const [{ status = "all", created }, rows] = await Promise.all([searchParams, getMyListings(user.id)]);
  const count = (s: string) => (s === "all" ? rows.length : rows.filter((r) => r.status === s).length);
  const filtered = status === "all" ? rows : rows.filter((r) => r.status === status);

  return (
    <div className="space-y-6">
      <PageHeader title="إعلاناتي" description="أدِر إعلاناتك، حدّث الأسعار، ووثّقها بتقارير الفحص." actions={<Button asChild><Link href="/account/listings/new"><Plus />إعلان جديد</Link></Button>} />
      {created && (
        <div className="rounded-xl border border-primary/25 bg-primary-soft/60 p-4 text-sm text-primary-ink">
          {created === "pending" ? "استلمنا إعلانك! يراجعه فريق سواب عادةً خلال ساعات قليلة، وبنبلّغك أول ما يُنشر." : "تم نشر إعلانك 🎉 شاركه مع أصحابك، ولا تنسَ توثيقه بتقرير فحص."}
        </div>
      )}
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0" role="tablist">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/account/listings" : `/account/listings?status=${t}`}
            role="tab"
            aria-selected={status === t}
            className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition", status === t ? "bg-graphite text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground")}
          >
            {t === "all" ? "الكل" : STATUS_META[t].label}
            <span className="text-[11px] opacity-70 num">{count(t)}</span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={rows.length === 0 ? "ما عندك إعلانات بعد" : "لا توجد إعلانات بهذه الحالة"}
          description={rows.length === 0 ? "أضف أول قطعة تبي تبيعها أو تبدّلها. ياخذ الأمر أقل من 3 دقائق." : undefined}
          action={rows.length === 0 ? <Button asChild><Link href="/account/listings/new"><Plus />أضف أول إعلان</Link></Button> : undefined}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          {filtered.map((l) => <MyListingRow key={l.id} l={l} />)}
        </ul>
      )}
    </div>
  );
}
