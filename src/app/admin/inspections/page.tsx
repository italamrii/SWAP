import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { VerificationBadge } from "@/components/inspection/verification-badge";
import { ListingImage } from "@/components/listings/listing-image";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { INSPECTION_SOURCES } from "@/lib/catalog/verification";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getInspectionQueue } from "@/server/queries/admin";

export const metadata: Metadata = { title: "تقارير الفحص" };

export default async function AdminInspections({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "submitted" } = await searchParams;
  const rows = await getInspectionQueue(tab === "reviewed" ? "reviewed" : "submitted");
  return (
    <div className="space-y-6">
      <PageHeader title="تقارير الفحص" description="راجع التقارير المقدمة وامنح مستوى التوثيق المناسب للأدلة — بدون مبالغة." />
      <div className="flex gap-1">
        {[["submitted", "بانتظار المراجعة"], ["reviewed", "تمت مراجعتها"]].map(([k, l]) => <Link key={k} href={`/admin/inspections?tab=${k}`} className={cn("inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium", tab === k ? "bg-graphite text-background" : "bg-surface-2 text-muted-foreground")}>{l}</Link>)}
      </div>
      {rows.length === 0 ? <EmptyState icon={ShieldCheck} title="لا توجد تقارير" description={tab === "submitted" ? "ما فيه تقارير بانتظار المراجعة." : undefined} /> : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/inspections/${r.id}`} className="flex items-center gap-3 p-4 transition hover:bg-surface-2/60">
                <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg border border-border"><ListingImage src={r.listingCover} alt="" sizes="80px" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.listingTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.sellerName} · {r.category} · {INSPECTION_SOURCES[r.source]}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {r.status === "submitted" ? <><span className="text-[11px] text-muted-foreground">يطلب</span><VerificationBadge level={r.requestedLevel} size="sm" /></> : r.grantedLevel ? <VerificationBadge level={r.grantedLevel} size="sm" /> : <Badge variant="danger" size="sm">مرفوض</Badge>}
                  <span className="text-[11px] text-subtle-foreground">{timeAgo(r.submittedAt ?? r.reviewedAt ?? new Date())}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
