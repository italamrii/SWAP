import { and, desc, eq, inArray } from "drizzle-orm";
import { BadgeCheck, FileCheck2, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StartInspectionButton } from "@/components/inspection/start-inspection-button";
import { VerificationBadge } from "@/components/inspection/verification-badge";
import { ListingImage } from "@/components/listings/listing-image";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { VERIFICATION_META } from "@/lib/catalog/verification";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { timeAgo } from "@/lib/format";
import { latestInspectionsFor } from "@/server/queries/inspections";

export const metadata: Metadata = { title: "التوثيق والفحص" };

const INSP_STATUS: Record<string, { label: string; v: "info" | "warning" | "verified" | "danger" | "neutral" }> = {
  draft: { label: "مسودة", v: "info" },
  submitted: { label: "قيد المراجعة", v: "warning" },
  approved: { label: "معتمد", v: "verified" },
  rejected: { label: "مرفوض", v: "danger" },
  superseded: { label: "مستبدل", v: "neutral" },
};

export default async function VerificationPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await requireUser("/account/verification");
  const sp = await searchParams;
  const mine = await db
    .select({ id: listings.id, slug: listings.slug, title: listings.title, coverImageUrl: listings.coverImageUrl, verificationLevel: listings.verificationLevel, status: listings.status })
    .from(listings)
    .where(and(eq(listings.sellerId, user.id), inArray(listings.status, ["active", "pending_review", "hidden"])))
    .orderBy(desc(listings.updatedAt));
  const insps = await latestInspectionsFor(mine.map((m) => m.id));
  const latest = new Map<string, (typeof insps)[number]>();
  for (const i of insps) if (!latest.has(i.listingId)) latest.set(i.listingId, i);

  return (
    <div className="space-y-6">
      <PageHeader title="التوثيق والفحص" description="أرفق تقرير فحص بإعلانك ليظهر بشارة توثيق ويتصدّر نتائج «الموثّقة أولًا»." />
      {sp.submitted && <Alert variant="success"><FileCheck2 /><div>وصلنا تقريرك! يراجعه الفريق عادةً خلال 24 ساعة، وبنبلّغك بالنتيجة.</div></Alert>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
        {([["seller_report", FileCheck2, "bg-info-soft text-info-ink"], ["platform_checked", ShieldCheck, "bg-primary-soft text-primary-ink"], ["partner_verified", BadgeCheck, "bg-primary text-primary-foreground"]] as const).map(([k, Icon, cls]) => (
          <div key={k} className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className={`flex size-8 items-center justify-center rounded-lg ${cls}`}><Icon className="size-4" /></span>
            <p className="mt-3 text-sm font-semibold">{VERIFICATION_META[k].label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{VERIFICATION_META[k].description}</p>
          </div>
        ))}
      </div>

      {mine.length === 0 ? (
        <EmptyState icon={ShieldQuestion} title="ما عندك إعلانات قابلة للتوثيق" description="أضف إعلانًا أولًا، ثم ارجع هنا لإرفاق تقرير الفحص." action={<Button asChild><Link href="/account/listings/new">أضف إعلان</Link></Button>} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          {mine.map((l) => {
            const i = latest.get(l.id);
            const st = i ? INSP_STATUS[i.status] : null;
            return (
              <li key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg border border-border"><ListingImage src={l.coverImageUrl} alt="" sizes="80px" /></div>
                  <div className="min-w-0">
                    <Link href={`/listing/${l.slug}`} className="line-clamp-1 text-sm font-semibold hover:text-primary-ink">{l.title}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <VerificationBadge level={l.verificationLevel} size="sm" showUnverified />
                      {st && <Badge variant={st.v} size="sm">التقرير: {st.label}</Badge>}
                      {i && <span className="text-[11px] text-subtle-foreground">{timeAgo(i.createdAt)}</span>}
                    </div>
                    {i?.status === "rejected" && i.reviewNote && <p className="mt-1.5 text-[12.5px] text-danger">ملاحظة المراجع: {i.reviewNote}</p>}
                  </div>
                </div>
                <div className="shrink-0">
                  {i?.status === "submitted" ? (
                    <span className="text-[13px] text-muted-foreground">بانتظار المراجعة</span>
                  ) : i?.status === "draft" ? (
                    <StartInspectionButton listingId={l.id} label="أكمل المسودة" />
                  ) : l.verificationLevel !== "unverified" ? (
                    <StartInspectionButton listingId={l.id} label="تحديث التقرير" variant="outline" />
                  ) : (
                    <StartInspectionButton listingId={l.id} label={i?.status === "rejected" ? "أرسل تقريرًا جديدًا" : "ابدأ التوثيق"} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
