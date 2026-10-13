import { FlagOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CloseTicketButton, ReportResolution } from "@/components/admin/controls";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { supportTickets } from "@/lib/db/schema";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { REPORT_REASONS } from "@/lib/validation/offers";
import { getAdminReports } from "@/server/queries/admin";

export const metadata: Metadata = { title: "البلاغات" };

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "open" } = await searchParams;
  const rows = tab === "support" ? [] : await getAdminReports(tab === "closed" ? "closed" : "open");
  const tickets = tab === "support" ? await db.select().from(supportTickets).where(eq(supportTickets.status, "open")).orderBy(desc(supportTickets.createdAt)).limit(100) : [];
  return (
    <div className="space-y-6">
      <PageHeader title="البلاغات" description="بلاغات المستخدمين عن إعلانات أو حسابات مخالفة. استهدف المعالجة خلال 24 ساعة." />
      <div className="flex gap-1">
        {[["open", "مفتوحة"], ["closed", "مغلقة"], ["support", "رسائل التواصل"]].map(([k, l]) => <Link key={k} href={`/admin/reports?tab=${k}`} className={cn("inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium", tab === k ? "bg-graphite text-background" : "bg-surface-2 text-muted-foreground")}>{l}</Link>)}
      </div>
      {tab === "support" ? (
        tickets.length === 0 ? <EmptyState icon={FlagOff} title="لا توجد رسائل مفتوحة" /> : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t.name} <a href={`mailto:${t.email}`} className="font-normal text-primary-ink hover:underline" dir="ltr">{t.email}</a></p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.topic} · {timeAgo(t.createdAt)}</p>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{t.message}</p>
                </div>
                <CloseTicketButton id={t.id} />
              </li>
            ))}
          </ul>
        )
      ) : rows.length === 0 ? <EmptyState icon={FlagOff} title="لا توجد بلاغات" description={tab === "open" ? "الطابور فاضي." : undefined} /> : (
        <ul className="space-y-3">
          {rows.map(({ report: r, reporterName, listing, user }) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="danger" size="sm">{REPORT_REASONS[r.reason]}</Badge>
                    <Badge variant="outline" size="sm">{r.targetType === "listing" ? "إعلان" : r.targetType === "user" ? "مستخدم" : "رسالة"}</Badge>
                    {r.status === "reviewing" && <Badge variant="warning" size="sm">قيد المراجعة</Badge>}
                    {r.status === "resolved" && <Badge variant="verified" size="sm">تمت المعالجة</Badge>}
                    {r.status === "dismissed" && <Badge variant="neutral" size="sm">مرفوض</Badge>}
                    <span className="text-xs text-subtle-foreground">{timeAgo(r.createdAt)} · من {reporterName ?? "مستخدم محذوف"}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {listing ? <Link href={`/listing/${listing.slug}`} target="_blank" className="hover:underline">{listing.title}</Link> : user ? <Link href={`/seller/${user.username}`} target="_blank" className="hover:underline">{user.name}</Link> : "المحتوى غير موجود"}
                  </p>
                  {r.details && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">«{r.details}»</p>}
                  {r.resolutionNote && <p className="mt-1.5 text-[13px] text-primary-ink">القرار: {r.resolutionNote}</p>}
                </div>
                <ReportResolution reportId={r.id} targetType={r.targetType} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
