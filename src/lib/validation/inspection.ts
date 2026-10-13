import { z } from "zod";
import { isTrustedImageUrl } from "./listing";

const optNum = (min: number, max: number, label: string) =>
  z.preprocess(
    (x) => (x === "" || x === null || x === undefined ? undefined : Number(x)),
    z.number({ invalid_type_error: `${label}: أدخل رقمًا` }).min(min, `${label}: قيمة غير منطقية`).max(max, `${label}: قيمة غير منطقية`).optional(),
  );
const optText = (max = 200) => z.preprocess((x) => (typeof x === "string" && x.trim() === "" ? undefined : x), z.string().trim().max(max).optional());

export const inspectionPayloadSchema = z.object({
  source: z.enum(["manual", "store_partner", "platform_tool"]),
  partnerName: optText(80),
  inspectedAt: z.coerce.date({ errorMap: () => ({ message: "أدخل تاريخ الفحص" }) }).refine((d) => d <= new Date(Date.now() + 864e5), "تاريخ الفحص لا يمكن أن يكون في المستقبل"),
  cpuModel: optText(), gpuModel: optText(), motherboard: optText(), os: optText(80),
  ramCapacityGb: optNum(1, 2048, "سعة الرام"),
  ramSpeedMhz: optNum(400, 15000, "سرعة الرام"),
  storage: z.array(z.object({ model: z.string().trim().min(1, "اكتب موديل القرص").max(120), type: optText(30), capacityGb: optNum(1, 100000, "السعة"), healthPct: optNum(0, 100, "الصحة"), powerOnHours: optNum(0, 500000, "ساعات التشغيل") })).max(8).default([]),
  temperatures: z.object({ cpuIdle: optNum(5, 120, "الحرارة"), cpuLoad: optNum(5, 120, "الحرارة"), gpuIdle: optNum(5, 120, "الحرارة"), gpuLoad: optNum(5, 120, "الحرارة") }).default({}),
  batteryHealthPct: optNum(0, 100, "صحة البطارية"),
  batteryCycles: optNum(0, 10000, "دورات الشحن"),
  screenNotes: optText(500), portsNotes: optText(500), summary: optText(800),
  benchmarks: z.array(z.object({ name: z.string().trim().min(1).max(80), score: z.string().trim().min(1).max(40), note: optText(80) })).max(10).default([]),
  stressTest: z.object({ tool: optText(60), durationMin: optNum(1, 1440, "مدة الاختبار"), passed: z.boolean().optional(), notes: optText(300) }).default({}),
  checklist: z.array(z.object({ key: z.string().max(40), ok: z.boolean().nullable(), note: optText(120) })).max(30).default([]),
  attachments: z.array(z.object({ url: z.string().refine(isTrustedImageUrl, "ملف غير مسموح"), kind: z.enum(["image", "pdf"]), label: optText(80) })).max(12).default([]),
});

export type InspectionPayload = z.input<typeof inspectionPayloadSchema>;

/** Extra rules that only apply when submitting for review (drafts can be partial). */
export function submissionProblems(d: z.output<typeof inspectionPayloadSchema>): Record<string, string[]> {
  const e: Record<string, string[]> = {};
  if (d.attachments.length === 0) e.attachments = ["أرفق صورة واحدة على الأقل، منها صورة الجهاز مع كود التحقق"];
  if (d.checklist.filter((c) => c.ok !== null).length < 3) e.checklist = ["حدّد نتيجة 3 بنود على الأقل من قائمة الفحص"];
  if (d.source === "store_partner" && !d.partnerName) e.partnerName = ["اكتب اسم المتجر الذي فحص الجهاز"];
  return e;
}

export const LEVEL_FOR_SOURCE = { manual: "seller_report", platform_tool: "platform_checked", store_partner: "partner_verified" } as const;
