"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertEligible } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { inspectionAttachments, inspectionReports, inspections, listings } from "@/lib/db/schema";
import { inspectionPayloadSchema, LEVEL_FOR_SOURCE, submissionProblems, type InspectionPayload } from "@/lib/validation/inspection";
import { checkEvidenceReuse } from "../services/guard";
import { run, zodFail, type Result } from "./_utils";

function newVerificationCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = crypto.getRandomValues(new Uint8Array(4));
  return `SW-${Array.from(rand, (b) => alphabet[b % alphabet.length]).join("")}`;
}

/** Owner-only: get the editable inspection for a listing (draft or rejected), or create a new draft. */
export async function startInspection(listingId: string): Promise<Result<{ inspectionId: string }>> {
  return run(async () => {
    const user = await assertEligible();
    if (!z.string().uuid().safeParse(listingId).success) return { ok: false, error: "طلب غير صالح" };
    const [l] = await db.select({ sellerId: listings.sellerId, status: listings.status }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!l || l.sellerId !== user.id) return { ok: false, error: "الإعلان غير موجود" };
    if (!["active", "pending_review", "hidden"].includes(l.status)) return { ok: false, error: "لا يمكن توثيق إعلان مُباع أو مرفوض" };
    const [submitted] = await db.select({ id: inspections.id }).from(inspections).where(and(eq(inspections.listingId, listingId), eq(inspections.status, "submitted"))).limit(1);
    if (submitted) return { ok: false, error: "لديك تقرير قيد المراجعة لهذا الإعلان" };
    const [draft] = await db.select({ id: inspections.id }).from(inspections).where(and(eq(inspections.listingId, listingId), eq(inspections.status, "draft"))).limit(1);
    if (draft) return { ok: true, data: { inspectionId: draft.id } };
    const [created] = await db
      .insert(inspections)
      .values({ listingId, submittedById: user.id, source: "manual", status: "draft", requestedLevel: "seller_report", verificationCode: newVerificationCode(), inspectedAt: new Date() })
      .returning({ id: inspections.id });
    await db.insert(inspectionReports).values({ inspectionId: created.id });
    return { ok: true, data: { inspectionId: created.id } };
  });
}

export async function saveInspection(inspectionId: string, input: InspectionPayload, submit: boolean): Promise<Result> {
  const res = await run<undefined>(async () => {
    const user = await assertEligible();
    if (!z.string().uuid().safeParse(inspectionId).success) return { ok: false, error: "طلب غير صالح" };
    const [insp] = await db.select().from(inspections).where(eq(inspections.id, inspectionId)).limit(1);
    if (!insp || insp.submittedById !== user.id) return { ok: false, error: "التقرير غير موجود" };
    if (insp.status !== "draft") return { ok: false, error: "لا يمكن تعديل تقرير بعد إرساله" };
    const parsed = inspectionPayloadSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    const d = parsed.data;
    if (submit) {
      const problems = submissionProblems(d);
      if (Object.keys(problems).length) return { ok: false, error: Object.values(problems)[0][0], fieldErrors: problems };
    }
    // Machine data can only come from the agent endpoint, never from the form.
    const source = d.source === "platform_tool" && !(await hasAgentPayload(inspectionId)) ? "manual" : d.source;
    await db.transaction(async (tx) => {
      await tx
        .update(inspections)
        .set({
          source, partnerName: source === "store_partner" ? d.partnerName : null, inspectedAt: d.inspectedAt, requestedLevel: LEVEL_FOR_SOURCE[source],
          status: submit ? "submitted" : "draft", submittedAt: submit ? new Date() : null,
        })
        .where(eq(inspections.id, inspectionId));
      await tx
        .update(inspectionReports)
        .set({
          cpuModel: d.cpuModel, gpuModel: d.gpuModel, motherboard: d.motherboard, os: d.os, ramCapacityGb: d.ramCapacityGb, ramSpeedMhz: d.ramSpeedMhz,
          storage: d.storage, temperatures: d.temperatures, batteryHealthPct: d.batteryHealthPct, batteryCycles: d.batteryCycles,
          screenNotes: d.screenNotes, portsNotes: d.portsNotes, summary: d.summary, benchmarks: d.benchmarks, stressTest: d.stressTest, checklist: d.checklist,
        })
        .where(eq(inspectionReports.inspectionId, inspectionId));
      await tx.delete(inspectionAttachments).where(eq(inspectionAttachments.inspectionId, inspectionId));
      if (d.attachments.length) await tx.insert(inspectionAttachments).values(d.attachments.map((a) => ({ inspectionId, url: a.url, kind: a.kind, label: a.label })));
    });
    // Evidence uploaded by another account (re-used screenshots, borrowed reports) is surfaced to the reviewer.
    if (submit) await checkEvidenceReuse(inspectionId, user.id, d.attachments.map((a) => a.url));
    revalidatePath("/account/verification");
    return { ok: true, message: submit ? "أرسلنا تقريرك للمراجعة" : "حفظنا المسودة" };
  });
  if (res.ok && submit) redirect("/account/verification?submitted=1");
  return res;
}

async function hasAgentPayload(inspectionId: string) {
  const [r] = await db.select({ raw: inspectionReports.rawPayload }).from(inspectionReports).where(eq(inspectionReports.inspectionId, inspectionId)).limit(1);
  return !!r?.raw;
}

export async function discardDraft(inspectionId: string): Promise<Result> {
  return run(async () => {
    const user = await assertEligible();
    await db.delete(inspections).where(and(eq(inspections.id, inspectionId), eq(inspections.submittedById, user.id), eq(inspections.status, "draft")));
    revalidatePath("/account/verification");
    return { ok: true, message: "حذفنا المسودة" };
  });
}
