import { AlertTriangle, ArrowRight, Fingerprint } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InspectionReview } from "@/components/admin/controls";
import { InspectionReport } from "@/components/inspection/inspection-report";
import { SpecTable } from "@/components/listings/spec-table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { INSPECTION_SOURCES, VERIFICATION_META } from "@/lib/catalog/verification";
import { formatDateTime } from "@/lib/format";
import { getInspectionDetail } from "@/server/queries/inspections";

export const metadata: Metadata = { title: "مراجعة تقرير" };

/** Cross-checks report data against listing claims to surface inconsistencies for the reviewer. */
function consistencyFlags(specs: Record<string, unknown>, r: NonNullable<Awaited<ReturnType<typeof getInspectionDetail>>>["report"]) {
  const flags: string[] = [];
  if (!r) return flags;
  const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const gpuClaim = norm(specs.gpu ?? specs.model);
  if (r.gpuModel && gpuClaim && !norm(r.gpuModel).includes(gpuClaim.slice(0, 8))) flags.push(`كرت الشاشة في التقرير (${r.gpuModel}) لا يطابق الإعلان (${String(specs.gpu ?? specs.model)})`);
  const ramClaim = Number(specs.ramGb ?? specs.capacityGb);
  if (r.ramCapacityGb && ramClaim && Math.abs(r.ramCapacityGb - ramClaim) > 2) flags.push(`سعة الرام في التقرير ${r.ramCapacityGb}GB والإعلان ${ramClaim}GB`);
  const batt = Number(specs.batteryHealth);
  if (r.batteryHealthPct !== null && batt && Math.abs(r.batteryHealthPct - batt) > 3) flags.push(`صحة البطارية في التقرير ${r.batteryHealthPct}% والإعلان ${batt}%`);
  if ((r.temperatures.gpuLoad ?? 0) >= 88 || (r.temperatures.cpuLoad ?? 0) >= 95) flags.push("حرارة تحت الحمل مرتفعة — تأكد من وجود ملاحظة في التقرير");
  if (r.checklist.some((c) => c.ok === false)) flags.push("بعض بنود قائمة الفحص فاشلة — تأكد أن الإعلان يوضحها");
  return flags;
}

export default async function ReviewInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const d = await getInspectionDetail(id);
  if (!d) notFound();
  const flags = consistencyFlags(d.listingSpecs as Record<string, unknown>, d.report);
  const preview = { ...d.inspection, grantedLevel: d.inspection.grantedLevel ?? d.inspection.requestedLevel, report: d.report, attachments: d.attachments };
  return (
    <div className="space-y-6">
      <Link href="/admin/inspections" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="size-4" />كل التقارير</Link>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">مراجعة تقرير الفحص</h1>
          <p className="mt-1 text-sm text-muted-foreground"><Link href={`/listing/${d.listingSlug}`} target="_blank" className="font-medium text-foreground hover:underline">{d.listingTitle}</Link> · {d.sellerName} · {d.categoryNameAr}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{INSPECTION_SOURCES[d.inspection.source]}{d.inspection.partnerName ? ` — ${d.inspection.partnerName}` : ""}</Badge>
          <Badge variant="info">يطلب: {VERIFICATION_META[d.inspection.requestedLevel].short}</Badge>
          {d.inspection.submittedAt && <Badge variant="neutral">أُرسل {formatDateTime(d.inspection.submittedAt)}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Alert variant="neutral"><Fingerprint /><div>كود التحقق المتوقع في صورة الجهاز: <b dir="ltr" className="text-foreground tracking-widest">{d.inspection.verificationCode}</b>. تأكد أنه ظاهر بوضوح بجانب الجهاز.</div></Alert>
          {flags.length > 0 && (
            <Alert variant="warning"><AlertTriangle /><div><b>نقاط تحتاج انتباهك:</b><ul className="mt-1 list-disc ps-5">{flags.map((f) => <li key={f}>{f}</li>)}</ul></div></Alert>
          )}
          <InspectionReport inspection={preview} />
          <section>
            <h2 className="mb-3 font-semibold">مواصفات الإعلان (للمقارنة)</h2>
            <SpecTable schemaKey={d.schemaKey} specs={d.listingSpecs as Record<string, string>} />
          </section>
        </div>
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            {d.inspection.status === "submitted" ? (
              <>
                <h2 className="mb-4 font-semibold">القرار</h2>
                <InspectionReview inspectionId={d.inspection.id} requestedLevel={d.inspection.requestedLevel} hasAgentData={!!d.report?.rawPayload} />
              </>
            ) : (
              <div className="text-sm">
                <p className="font-semibold">تمت مراجعة هذا التقرير</p>
                <p className="mt-1 text-muted-foreground">الحالة: {d.inspection.status === "approved" ? `معتمد (${VERIFICATION_META[d.inspection.grantedLevel ?? "seller_report"].short})` : d.inspection.status === "rejected" ? "مرفوض" : d.inspection.status}</p>
                {d.inspection.reviewNote && <p className="mt-2 text-muted-foreground">«{d.inspection.reviewNote}»</p>}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
