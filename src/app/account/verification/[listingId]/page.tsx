import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InspectionForm } from "@/components/inspection/inspection-form";
import { ListingImage } from "@/components/listings/listing-image";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categories, listings } from "@/lib/db/schema";
import { startInspection } from "@/server/actions/inspections";
import { getInspectionDetail } from "@/server/queries/inspections";

export const metadata: Metadata = { title: "تقرير الفحص" };

export default async function InspectionEditorPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const user = await requireUser(`/account/verification/${listingId}`);
  if (!/^[0-9a-f-]{36}$/.test(listingId)) notFound();
  const [l] = await db
    .select({ id: listings.id, title: listings.title, slug: listings.slug, cover: listings.coverImageUrl, specs: listings.specs, schemaKey: categories.schemaKey })
    .from(listings)
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .where(and(eq(listings.id, listingId), eq(listings.sellerId, user.id)))
    .limit(1);
  if (!l) notFound();

  const started = await startInspection(listingId);
  if (!started.ok) {
    return (
      <div className="space-y-6">
        <PageHeader title="تقرير الفحص" description={l.title} />
        <Alert variant="warning">{started.error}. <Link href="/account/verification" className="font-semibold underline">العودة</Link></Alert>
      </div>
    );
  }
  const detail = await getInspectionDetail(started.data!.inspectionId);
  if (!detail) redirect("/account/verification");
  const r = detail.report;
  const s = (x: number | null | undefined) => (x === null || x === undefined ? "" : String(x));
  const specs = l.specs as Record<string, string | number | boolean>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقرير الفحص"
        description="كل ما كان التقرير أدق وأكمل، كان مستوى التوثيق أعلى وثقة المشتري أكبر."
        actions={
          <Link href={`/listing/${l.slug}`} className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2 pe-3 text-sm shadow-xs hover:border-border-strong">
            <span className="relative aspect-[4/3] w-12 overflow-hidden rounded-md"><ListingImage src={l.cover} alt="" sizes="48px" /></span>
            <span className="max-w-48 truncate font-medium">{l.title}</span>
          </Link>
        }
      />
      <InspectionForm
        inspectionId={detail.inspection.id}
        schemaKey={l.schemaKey}
        verificationCode={detail.inspection.verificationCode}
        initial={{
          source: detail.inspection.source,
          partnerName: detail.inspection.partnerName ?? "",
          inspectedAt: new Date(detail.inspection.inspectedAt).toISOString().slice(0, 10),
          // Prefill from listing specs when the report is still empty.
          cpuModel: r?.cpuModel ?? (typeof specs.cpu === "string" ? specs.cpu : typeof specs.model === "string" && l.schemaKey === "cpu" ? specs.model : ""),
          gpuModel: r?.gpuModel ?? (typeof specs.gpu === "string" ? specs.gpu : typeof specs.model === "string" && l.schemaKey === "gpu" ? specs.model : ""),
          motherboard: r?.motherboard ?? (typeof specs.motherboard === "string" ? specs.motherboard : ""),
          os: r?.os ?? (typeof specs.os === "string" ? specs.os : ""),
          ramCapacityGb: s(r?.ramCapacityGb) || (specs.ramGb ? String(specs.ramGb) : specs.capacityGb && l.schemaKey === "ram" ? String(specs.capacityGb) : ""),
          ramSpeedMhz: s(r?.ramSpeedMhz) || (specs.ramSpeed ? String(specs.ramSpeed) : specs.speed ? String(specs.speed) : ""),
          storage: (r?.storage ?? []).map((d) => ({ model: d.model, type: d.type, capacityGb: s(d.capacityGb), healthPct: s(d.healthPct), powerOnHours: s(d.powerOnHours) })),
          temperatures: { cpuIdle: s(r?.temperatures.cpuIdle), cpuLoad: s(r?.temperatures.cpuLoad), gpuIdle: s(r?.temperatures.gpuIdle) || (specs.tempIdle ? String(specs.tempIdle) : ""), gpuLoad: s(r?.temperatures.gpuLoad) || (specs.tempLoad ? String(specs.tempLoad) : "") },
          batteryHealthPct: s(r?.batteryHealthPct) || (specs.batteryHealth ? String(specs.batteryHealth) : ""),
          batteryCycles: s(r?.batteryCycles) || (specs.batteryCycles ? String(specs.batteryCycles) : ""),
          screenNotes: r?.screenNotes ?? "", portsNotes: r?.portsNotes ?? "", summary: r?.summary ?? "",
          benchmarks: (r?.benchmarks ?? []).map((b) => ({ name: b.name, score: b.score, note: b.note })),
          stressTest: { tool: r?.stressTest.tool, durationMin: s(r?.stressTest.durationMin), passed: r?.stressTest.passed, notes: r?.stressTest.notes },
          checklist: Object.fromEntries((r?.checklist ?? []).map((c) => [c.key, c.ok])),
          attachments: detail.attachments.map((a) => ({ url: a.url, kind: a.kind === "pdf" ? "pdf" : "image", label: a.label ?? "" })),
        }}
      />
    </div>
  );
}
