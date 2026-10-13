"use client";

import { Camera, Check, CircleHelp, Copy, FileText, Fingerprint, Loader2, Plus, ScanSearch, Store, Trash2, Upload, UserRound, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/components/listings/form/image-uploader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, InputAdorned, Textarea } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { checklistFor, reportSections } from "@/lib/catalog/inspection";
import { INSPECTION_DISCLAIMER } from "@/lib/catalog/verification";
import { cn } from "@/lib/utils";
import { saveInspection } from "@/server/actions/inspections";

type Drive = { model: string; type?: string; capacityGb?: string; healthPct?: string; powerOnHours?: string };
type Bench = { name: string; score: string; note?: string };
type Attachment = { url: string; kind: "image" | "pdf"; label?: string };

export interface InspectionFormInitial {
  source: "manual" | "store_partner" | "platform_tool";
  partnerName: string;
  inspectedAt: string;
  cpuModel: string; gpuModel: string; motherboard: string; os: string;
  ramCapacityGb: string; ramSpeedMhz: string;
  storage: Drive[];
  temperatures: { cpuIdle?: string; cpuLoad?: string; gpuIdle?: string; gpuLoad?: string };
  batteryHealthPct: string; batteryCycles: string;
  screenNotes: string; portsNotes: string; summary: string;
  benchmarks: Bench[];
  stressTest: { tool?: string; durationMin?: string; passed?: boolean; notes?: string };
  checklist: Record<string, boolean | null>;
  attachments: Attachment[];
}

export function InspectionForm({ inspectionId, schemaKey, verificationCode, initial }: { inspectionId: string; schemaKey: string; verificationCode: string; initial: InspectionFormInitial }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [consent, setConsent] = useState(false);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const agentRef = useRef<HTMLInputElement>(null);
  const sec = reportSections(schemaKey);
  const items = checklistFor(schemaKey);
  const set = <K extends keyof InspectionFormInitial>(k: K, val: InspectionFormInitial[K]) => setV((p) => ({ ...p, [k]: val }));

  function payload() {
    const n = (x?: string) => (x === undefined || x === "" ? undefined : Number(x));
    return {
      source: v.source === "platform_tool" ? ("platform_tool" as const) : v.source,
      partnerName: v.partnerName || undefined,
      inspectedAt: new Date(v.inspectedAt),
      cpuModel: v.cpuModel, gpuModel: v.gpuModel, motherboard: v.motherboard, os: v.os,
      ramCapacityGb: n(v.ramCapacityGb), ramSpeedMhz: n(v.ramSpeedMhz),
      storage: v.storage.filter((d) => d.model.trim()).map((d) => ({ model: d.model, type: d.type, capacityGb: n(d.capacityGb), healthPct: n(d.healthPct), powerOnHours: n(d.powerOnHours) })),
      temperatures: { cpuIdle: n(v.temperatures.cpuIdle), cpuLoad: n(v.temperatures.cpuLoad), gpuIdle: n(v.temperatures.gpuIdle), gpuLoad: n(v.temperatures.gpuLoad) },
      batteryHealthPct: n(v.batteryHealthPct), batteryCycles: n(v.batteryCycles),
      screenNotes: v.screenNotes, portsNotes: v.portsNotes, summary: v.summary,
      benchmarks: v.benchmarks.filter((b) => b.name.trim() && b.score.trim()),
      stressTest: { tool: v.stressTest.tool, durationMin: n(v.stressTest.durationMin), passed: v.stressTest.passed, notes: v.stressTest.notes },
      checklist: items.map((i) => ({ key: i.key, ok: v.checklist[i.key] ?? null })),
      attachments: v.attachments,
    };
  }

  function save(submit: boolean) {
    if (submit && !consent) return toast.error("يلزم الإقرار بصحة البيانات قبل الإرسال");
    start(async () => {
      const r = await saveInspection(inspectionId, payload(), submit);
      if (r && !r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error);
      } else if (r?.ok) {
        toast.success(r.message);
        setErrors({});
      }
    });
  }

  async function onFiles(files: FileList) {
    setUploading(true);
    try {
      for (const f of Array.from(files).slice(0, 12 - v.attachments.length)) {
        try {
          const r = await uploadFile(f, "inspection");
          setV((p) => ({ ...p, attachments: [...p.attachments, { url: r.url, kind: r.kind, label: p.attachments.length === 0 ? "صورة الجهاز مع كود التحقق" : "" }] }));
        } catch (e) {
          toast.error(`${f.name}: ${(e as Error).message}`);
        }
      }
    } finally {
      setUploading(false);
      setErrors((e) => ({ ...e, attachments: undefined }));
    }
  }

  /** Prefill from a SWAP Inspect JSON export (preview format; see docs/05-INSPECTION-AGENT.md). */
  async function importAgentJson(file: File) {
    try {
      const j = JSON.parse(await file.text());
      const hw = j.hardware ?? {};
      setV((p) => ({
        ...p,
        cpuModel: hw.cpu?.name ?? p.cpuModel,
        gpuModel: hw.gpu?.[0]?.name ?? p.gpuModel,
        motherboard: hw.motherboard ?? p.motherboard,
        os: j.os ?? p.os,
        ramCapacityGb: hw.memory?.totalGb ? String(hw.memory.totalGb) : p.ramCapacityGb,
        ramSpeedMhz: hw.memory?.speedMhz ? String(hw.memory.speedMhz) : p.ramSpeedMhz,
        storage: Array.isArray(hw.storage) ? hw.storage.map((d: Record<string, unknown>) => ({ model: String(d.model ?? ""), type: d.type ? String(d.type) : undefined, capacityGb: d.capacityGb ? String(d.capacityGb) : undefined, healthPct: d.healthPct !== undefined ? String(d.healthPct) : undefined, powerOnHours: d.powerOnHours ? String(d.powerOnHours) : undefined })) : p.storage,
        batteryHealthPct: hw.battery?.healthPct !== undefined ? String(hw.battery.healthPct) : p.batteryHealthPct,
        batteryCycles: hw.battery?.cycles !== undefined ? String(hw.battery.cycles) : p.batteryCycles,
      }));
      toast.success("عبّينا الحقول من ملف الأداة. راجعها قبل الإرسال.", { description: "رفع الملف يدويًا يُعامل كتقرير بائع؛ مستوى «فحص المنصة» يتطلب إرسال الأداة مباشرة." });
    } catch {
      toast.error("الملف ليس بصيغة تقرير سواب");
    }
  }

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save(true); }} noValidate>
      {/* Verification code */}
      <section className="overflow-hidden rounded-2xl border border-primary/25 bg-surface shadow-xs">
        <div className="flex flex-col gap-4 bg-gradient-to-l from-primary-soft/80 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-3">
            <Fingerprint className="mt-0.5 size-6 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">كود التحقق الخاص بهذا التقرير</h2>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-muted-foreground">اكتب الكود على ورقة وصوّرها بجانب الجهاز وهو يعمل، وأرفق الصورة ضمن الأدلة. يثبت ذلك أن القطعة بحوزتك فعلًا.</p>
            </div>
          </div>
          <button type="button" onClick={() => { void navigator.clipboard.writeText(verificationCode); toast.success("نسخنا الكود"); }} className="flex items-center gap-3 self-start rounded-xl border-2 border-dashed border-primary/40 bg-surface px-5 py-3 sm:self-auto" aria-label="نسخ كود التحقق">
            <span className="text-2xl font-bold tracking-[0.2em] text-primary-ink" dir="ltr">{verificationCode}</span>
            <Copy className="size-4 text-muted-foreground" />
          </button>
        </div>
      </section>

      {/* Source */}
      <Block title="مصدر الفحص" description="اختر الطريقة اللي فُحص بها الجهاز. المستوى النهائي يحدده فريق المراجعة.">
        <RadioCards
          value={v.source}
          onValueChange={(s) => set("source", s as InspectionFormInitial["source"])}
          className="sm:grid-cols-3"
          options={[
            { value: "manual", label: "فحصته بنفسي", description: "تعبئة يدوية + لقطات من أدوات الفحص. ← «تقرير البائع»", icon: <UserRound className="size-5" /> },
            { value: "store_partner", label: "متجر شريك", description: "فُحص لدى متجر معتمد وأرفقت تقريره. ← «شريك معتمد»", icon: <Store className="size-5" /> },
            { value: "platform_tool", label: "أداة سواب للفحص", description: "قريبًا: تطبيق يجمع البيانات آليًا. ← «فحص المنصة»", icon: <ScanSearch className="size-5" /> },
          ]}
        />
        {v.source === "store_partner" && (
          <Field label="اسم المتجر" required className="mt-4 max-w-sm" error={errors.partnerName}>
            <Input value={v.partnerName} onChange={(e) => set("partnerName", e.target.value)} placeholder="مثلًا: مختبر الشرقية للحاسبات" />
          </Field>
        )}
        {v.source === "platform_tool" && (
          <Alert variant="info" className="mt-4">
            <ScanSearch />
            <div>
              <b>أداة سواب للفحص في مرحلة تجريبية مغلقة.</b> عند إطلاقها ستُرسل النتائج مباشرة إلى هذا التقرير مع بصمة رقمية. حاليًا تقدر تستورد ملف JSON من النسخة التجريبية لتعبئة الحقول.
              <div className="mt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => agentRef.current?.click()}><Upload />استيراد ملف الأداة (JSON)</Button>
                <input ref={agentRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importAgentJson(f); e.target.value = ""; }} />
              </div>
            </div>
          </Alert>
        )}
        <Field label="تاريخ الفحص" required className="mt-4 max-w-56" error={errors.inspectedAt}>
          <Input type="date" dir="ltr" className="text-start" value={v.inspectedAt} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set("inspectedAt", e.target.value)} />
        </Field>
      </Block>

      {/* Hardware */}
      {(sec.cpu || sec.gpu || sec.motherboard || sec.ram || sec.system) && (
        <Block title="المكونات" description="اكتبها كما تظهر في أداة مثل HWiNFO أو CPU-Z.">
          <div className="grid gap-4 sm:grid-cols-2">
            {sec.cpu && <Field label="المعالج"><Input dir="ltr" className="text-start" value={v.cpuModel} onChange={(e) => set("cpuModel", e.target.value)} placeholder="AMD Ryzen 7 7800X3D" /></Field>}
            {sec.gpu && <Field label="كرت الشاشة"><Input dir="ltr" className="text-start" value={v.gpuModel} onChange={(e) => set("gpuModel", e.target.value)} placeholder="NVIDIA GeForce RTX 4070 SUPER 12GB" /></Field>}
            {sec.motherboard && <Field label="اللوحة الأم"><Input dir="ltr" className="text-start" value={v.motherboard} onChange={(e) => set("motherboard", e.target.value)} /></Field>}
            {sec.ram && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="سعة الرام" error={errors.ramCapacityGb}><InputAdorned dir="ltr" inputMode="numeric" className="text-start" end="GB" value={v.ramCapacityGb} onChange={(e) => set("ramCapacityGb", e.target.value.replace(/\D/g, ""))} /></Field>
                <Field label="السرعة" error={errors.ramSpeedMhz}><InputAdorned dir="ltr" inputMode="numeric" className="text-start" end="MHz" value={v.ramSpeedMhz} onChange={(e) => set("ramSpeedMhz", e.target.value.replace(/\D/g, ""))} /></Field>
              </div>
            )}
            {sec.system && <Field label="نظام التشغيل"><Input dir="ltr" className="text-start" value={v.os} onChange={(e) => set("os", e.target.value)} placeholder="Windows 11 Pro 23H2" /></Field>}
          </div>
        </Block>
      )}

      {sec.storage && (
        <Block title="التخزين" description="من CrystalDiskInfo: الموديل، الصحة، وساعات التشغيل.">
          <div className="space-y-3">
            {v.storage.map((d, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
                <Field label="الموديل"><Input dir="ltr" className="text-start" value={d.model} onChange={(e) => set("storage", v.storage.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)))} /></Field>
                <Field label="السعة"><InputAdorned dir="ltr" inputMode="numeric" className="text-start" end="GB" value={d.capacityGb ?? ""} onChange={(e) => set("storage", v.storage.map((x, j) => (j === i ? { ...x, capacityGb: e.target.value.replace(/\D/g, "") } : x)))} /></Field>
                <Field label="الصحة"><InputAdorned dir="ltr" inputMode="numeric" className="text-start" end="%" value={d.healthPct ?? ""} onChange={(e) => set("storage", v.storage.map((x, j) => (j === i ? { ...x, healthPct: e.target.value.replace(/\D/g, "") } : x)))} /></Field>
                <Field label="ساعات التشغيل"><Input dir="ltr" inputMode="numeric" className="text-start" value={d.powerOnHours ?? ""} onChange={(e) => set("storage", v.storage.map((x, j) => (j === i ? { ...x, powerOnHours: e.target.value.replace(/\D/g, "") } : x)))} /></Field>
                <Button type="button" variant="ghost" size="icon" aria-label="حذف القرص" onClick={() => set("storage", v.storage.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            {v.storage.length < 8 && <Button type="button" variant="outline" size="sm" onClick={() => set("storage", [...v.storage, { model: "" }])}><Plus />إضافة قرص</Button>}
          </div>
        </Block>
      )}

      {(sec.temps || sec.battery) && (
        <Block title="الحرارة والبطارية">
          <div className="grid gap-4 sm:grid-cols-2">
            {sec.temps && (
              <div className="grid grid-cols-2 gap-3">
                {([["cpuIdle", "المعالج — خامل"], ["cpuLoad", "المعالج — حمل"], ["gpuIdle", "الكرت — خامل"], ["gpuLoad", "الكرت — حمل"]] as const).map(([k, l]) => (
                  <Field key={k} label={l}><InputAdorned dir="ltr" inputMode="numeric" className="text-start" end="°C" value={v.temperatures[k] ?? ""} onChange={(e) => set("temperatures", { ...v.temperatures, [k]: e.target.value.replace(/\D/g, "") })} /></Field>
                ))}
              </div>
            )}
            {sec.battery && (
              <div className="grid grid-cols-2 content-start gap-3">
                <Field label="صحة البطارية" error={errors.batteryHealthPct}><InputAdorned dir="ltr" inputMode="numeric" className="text-start" end="%" value={v.batteryHealthPct} onChange={(e) => set("batteryHealthPct", e.target.value.replace(/\D/g, ""))} /></Field>
                <Field label="دورات الشحن"><Input dir="ltr" inputMode="numeric" className="text-start" value={v.batteryCycles} onChange={(e) => set("batteryCycles", e.target.value.replace(/\D/g, ""))} /></Field>
              </div>
            )}
          </div>
        </Block>
      )}

      {(sec.screen || sec.ports) && (
        <Block title="الشاشة والمنافذ">
          <div className="grid gap-4 sm:grid-cols-2">
            {sec.screen && <Field label="ملاحظات الشاشة"><Textarea rows={3} value={v.screenNotes} onChange={(e) => set("screenNotes", e.target.value)} placeholder="بكسلات ميتة؟ تسريب إضاءة؟ خدوش؟" /></Field>}
            {sec.ports && <Field label="المنافذ والاتصال"><Textarea rows={3} value={v.portsNotes} onChange={(e) => set("portsNotes", e.target.value)} placeholder="هل جربت كل منافذ USB وHDMI والواي فاي؟" /></Field>}
          </div>
        </Block>
      )}

      {sec.benchmarks && (
        <Block title="الأداء واختبار الضغط" description="أضف نتائج اختبارات معروفة، وأرفق لقطاتها ضمن الأدلة.">
          <div className="space-y-3">
            {v.benchmarks.map((b, i) => (
              <div key={i} className="grid grid-cols-[1fr_9rem_auto] items-end gap-2">
                <Field label={i === 0 ? "الاختبار" : undefined}><Input dir="ltr" className="text-start" value={b.name} placeholder="3DMark Time Spy" onChange={(e) => set("benchmarks", v.benchmarks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
                <Field label={i === 0 ? "النتيجة" : undefined}><Input dir="ltr" className="text-start" value={b.score} placeholder="20,412" onChange={(e) => set("benchmarks", v.benchmarks.map((x, j) => (j === i ? { ...x, score: e.target.value } : x)))} /></Field>
                <Button type="button" variant="ghost" size="icon" aria-label="حذف" onClick={() => set("benchmarks", v.benchmarks.filter((_, j) => j !== i))}><X className="size-4" /></Button>
              </div>
            ))}
            {v.benchmarks.length < 10 && <Button type="button" variant="outline" size="sm" onClick={() => set("benchmarks", [...v.benchmarks, { name: "", score: "" }])}><Plus />إضافة نتيجة</Button>}
          </div>
          <div className="mt-5 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
            <Field label="أداة اختبار الضغط"><Input dir="ltr" className="text-start" value={v.stressTest.tool ?? ""} placeholder="FurMark 2 / OCCT / Prime95" onChange={(e) => set("stressTest", { ...v.stressTest, tool: e.target.value })} /></Field>
            <Field label="المدة"><InputAdorned dir="ltr" inputMode="numeric" className="text-start" end="دقيقة" value={v.stressTest.durationMin ?? ""} onChange={(e) => set("stressTest", { ...v.stressTest, durationMin: e.target.value.replace(/\D/g, "") })} /></Field>
            <TriState label="النتيجة" value={v.stressTest.passed ?? null} onChange={(ok) => set("stressTest", { ...v.stressTest, passed: ok ?? undefined })} labels={["نجح", "فشل"]} />
            <Field label="ملاحظات" className="sm:col-span-3"><Input value={v.stressTest.notes ?? ""} onChange={(e) => set("stressTest", { ...v.stressTest, notes: e.target.value })} placeholder="أقصى حرارة، أي انطفاء أو تشوهات…" /></Field>
          </div>
        </Block>
      )}

      <Block title="قائمة الفحص" description="حدّد نتيجة كل بند. «لم يُختبر» أفضل من إجابة غير دقيقة." error={errors.checklist}>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.map((it) => (
            <li key={it.key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm">{it.label}</span>
              <TriState value={v.checklist[it.key] ?? null} onChange={(ok) => { set("checklist", { ...v.checklist, [it.key]: ok }); setErrors((e) => ({ ...e, checklist: undefined })); }} labels={["نعم", "لا"]} />
            </li>
          ))}
        </ul>
      </Block>

      <Block title="الأدلة المرفقة" description="صورة الجهاز مع كود التحقق (إلزامية)، ولقطات أدوات الفحص، أو تقرير المتجر بصيغة PDF." error={errors.attachments}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {v.attachments.map((a, i) => (
            <div key={a.url} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="relative aspect-[4/3] bg-surface-2">
                {a.kind === "pdf" ? <div className="flex size-full items-center justify-center"><FileText className="size-8 text-muted-foreground" /></div> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" className="size-full object-cover" />
                )}
                <button type="button" onClick={() => set("attachments", v.attachments.filter((_, j) => j !== i))} className="absolute top-1.5 end-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white" aria-label="حذف المرفق"><X className="size-4" /></button>
              </div>
              <input value={a.label ?? ""} onChange={(e) => set("attachments", v.attachments.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="وصف المرفق" className="w-full border-t border-border bg-transparent px-2.5 py-2 text-xs outline-none" aria-label="وصف المرفق" maxLength={80} />
            </div>
          ))}
          {v.attachments.length < 12 && (
            <button type="button" onClick={() => fileRef.current?.click()} className={cn("flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-[13px] font-semibold transition hover:border-primary/60", errors.attachments ? "border-danger/50 bg-danger-soft/40" : "border-border-strong")}>
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5 text-muted-foreground" />}
              إضافة صورة أو PDF
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => { if (e.target.files) void onFiles(e.target.files); e.target.value = ""; }} />
      </Block>

      <Block title="ملخص التقرير" description="جملتين تلخّص حالة الجهاز بصدق.">
        <Textarea rows={3} maxLength={800} value={v.summary} onChange={(e) => set("summary", e.target.value)} placeholder="مثلًا: الكرت يعمل بأداء مطابق للمرجع، والحرارة طبيعية، ولا توجد علامات فك." />
      </Block>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5" />
          <span>أقر بأن البيانات والأدلة المرفقة صحيحة وتخص الجهاز المعروض في الإعلان، وأفهم أن تقديم معلومات مضللة يؤدي لإيقاف الحساب.</span>
        </label>
        <p className="mt-3 text-xs text-muted-foreground">{INSPECTION_DISCLAIMER}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={pending} onClick={() => save(false)}>حفظ كمسودة</Button>
          <Button type="submit" loading={pending}><Check />إرسال للمراجعة</Button>
        </div>
      </div>
    </form>
  );
}

function Block({ title, description, error, children }: { title: string; description?: string; error?: string[]; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-surface p-5 shadow-xs sm:p-6", error ? "border-danger/40" : "border-border")}>
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      {error?.[0] && <p role="alert" className="mt-2 text-[13px] text-danger">{error[0]}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TriState({ value, onChange, labels, label }: { value: boolean | null; onChange: (v: boolean | null) => void; labels: [string, string]; label?: string }) {
  const opts: { v: boolean | null; l: string; icon: React.ReactNode }[] = [
    { v: true, l: labels[0], icon: <Check className="size-3.5" /> },
    { v: false, l: labels[1], icon: <X className="size-3.5" /> },
    { v: null, l: "لم يُختبر", icon: <CircleHelp className="size-3.5" /> },
  ];
  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium">{label}</span>}
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-surface-2 p-1">
        {opts.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[12.5px] font-medium transition",
              value === o.v ? (o.v === true ? "bg-primary text-primary-foreground" : o.v === false ? "bg-danger text-white" : "bg-surface text-foreground shadow-xs") : "text-muted-foreground",
            )}
          >
            {o.icon}{o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
