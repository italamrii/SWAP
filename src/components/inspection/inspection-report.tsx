import { AlertTriangle, BatteryMedium, Check, CircleHelp, Cpu, FileText, Fingerprint, Gauge, HardDrive, MemoryStick, Monitor, Plug, Thermometer, X } from "lucide-react";
import { checklistLabel } from "@/lib/catalog/inspection";
import { INSPECTION_DISCLAIMER, INSPECTION_SOURCES, INSPECTION_VALIDITY_DAYS, VERIFICATION_META } from "@/lib/catalog/verification";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApprovedInspection } from "@/server/queries/listings";
import { BidiText } from "@/components/shared/bidi-text";
import { VerificationBadge } from "./verification-badge";

export function InspectionReport({ inspection, compact }: { inspection: ApprovedInspection; compact?: boolean }) {
  const r = inspection.report;
  const level = inspection.grantedLevel ?? "seller_report";
  const ageDays = Math.floor((Date.now() - new Date(inspection.inspectedAt).getTime()) / 864e5);
  const stale = ageDays > INSPECTION_VALIDITY_DAYS;
  const passed = r?.checklist.filter((c) => c.ok === true).length ?? 0;
  const total = r?.checklist.length ?? 0;
  const temps = r?.temperatures ?? {};
  const hasTemps = Object.values(temps).some((v) => v !== undefined && v !== null);

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-surface shadow-xs">
      {/* Header */}
      <div className="relative border-b border-border bg-gradient-to-l from-primary-soft/70 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <VerificationBadge level={level} size="lg" />
              {stale && <span className="inline-flex h-7 items-center gap-1 rounded-full bg-warning-soft px-2.5 text-xs font-semibold text-warning"><AlertTriangle className="size-3.5" />تقرير قديم</span>}
            </div>
            <h2 className="mt-3 text-lg font-bold">تقرير الفحص</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{VERIFICATION_META[level].description}</p>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <ScoreRing value={passed} total={total} />
              <div className="text-[13px]">
                <div className="font-semibold">اجتاز {passed} من {total}</div>
                <div className="text-muted-foreground">بنود الفحص</div>
              </div>
            </div>
          )}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-4">
          <Meta label="تاريخ الفحص" value={`${formatDate(inspection.inspectedAt)}`} sub={timeAgo(inspection.inspectedAt)} />
          <Meta label="مصدر الفحص" value={inspection.partnerName ?? INSPECTION_SOURCES[inspection.source]} />
          <Meta label="مراجعة سواب" value={inspection.reviewedAt ? formatDate(inspection.reviewedAt) : "—"} />
          <Meta label="كود التحقق" value={inspection.verificationCode} ltr icon={<Fingerprint className="size-3.5" />} />
        </dl>
      </div>

      {r && (
        <div className="space-y-6 p-5 sm:p-6">
          {r.summary && <p className="rounded-xl bg-surface-2 p-4 text-sm leading-relaxed"><BidiText text={r.summary} /></p>}

          {(r.cpuModel || r.gpuModel || r.motherboard || r.ramCapacityGb || r.os) && (
            <Block title="مكونات مكتشفة">
              <div className="grid gap-2 sm:grid-cols-2">
                {r.cpuModel && <HwRow icon={Cpu} label="المعالج" value={r.cpuModel} />}
                {r.gpuModel && <HwRow icon={Monitor} label="كرت الشاشة" value={r.gpuModel} />}
                {r.motherboard && <HwRow icon={Plug} label="اللوحة الأم" value={r.motherboard} />}
                {r.ramCapacityGb && <HwRow icon={MemoryStick} label="الذاكرة" value={`${r.ramCapacityGb}GB${r.ramSpeedMhz ? ` @ ${r.ramSpeedMhz}MHz` : ""}`} />}
                {r.os && <HwRow icon={FileText} label="نظام التشغيل" value={r.os} />}
              </div>
            </Block>
          )}

          {r.storage.length > 0 && (
            <Block title="التخزين">
              <div className="space-y-2">
                {r.storage.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <HardDrive className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" dir="ltr">{d.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {[d.type, d.capacityGb ? (d.capacityGb >= 1024 ? `${d.capacityGb / 1024}TB` : `${d.capacityGb}GB`) : null, d.powerOnHours ? `${d.powerOnHours.toLocaleString("en-US")} ساعة تشغيل` : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {d.healthPct !== undefined && <HealthBar value={d.healthPct} label="الصحة" />}
                  </div>
                ))}
              </div>
            </Block>
          )}

          {(r.batteryHealthPct !== null || hasTemps) && (
            <div className="grid gap-6 sm:grid-cols-2">
              {r.batteryHealthPct !== null && (
                <Block title="البطارية">
                  <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                    <BatteryMedium className="size-6 text-muted-foreground" aria-hidden />
                    <div className="flex-1"><HealthBar value={r.batteryHealthPct} label="صحة البطارية" wide /></div>
                    {r.batteryCycles !== null && <div className="text-center text-xs text-muted-foreground"><div className="text-base font-bold text-foreground num">{r.batteryCycles}</div>دورة</div>}
                  </div>
                </Block>
              )}
              {hasTemps && (
                <Block title="درجات الحرارة">
                  <div className="grid grid-cols-2 gap-2">
                    {temps.cpuIdle !== undefined && <TempCell label="المعالج — خامل" v={temps.cpuIdle} />}
                    {temps.cpuLoad !== undefined && <TempCell label="المعالج — حمل" v={temps.cpuLoad} load />}
                    {temps.gpuIdle !== undefined && <TempCell label="الكرت — خامل" v={temps.gpuIdle} />}
                    {temps.gpuLoad !== undefined && <TempCell label="الكرت — حمل" v={temps.gpuLoad} load />}
                  </div>
                </Block>
              )}
            </div>
          )}

          {(r.benchmarks.length > 0 || r.stressTest?.tool) && (
            <Block title="الأداء واختبار الضغط">
              <div className="grid gap-2 sm:grid-cols-2">
                {r.benchmarks.map((b, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" dir="ltr">{b.name}</p>
                      {b.note && <p className="text-xs text-muted-foreground">{b.note}</p>}
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold num" dir="ltr"><Gauge className="size-4 text-primary" />{b.score}</span>
                  </div>
                ))}
                {r.stressTest?.tool && (
                  <div className={cn("rounded-xl border p-3 sm:col-span-2", r.stressTest.passed ? "border-primary/25 bg-primary-soft/40" : "border-warning/25 bg-warning-soft")}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {r.stressTest.passed ? <Check className="size-4 text-primary" /> : <AlertTriangle className="size-4 text-warning" />}
                      اختبار الضغط: <bdi>{r.stressTest.tool}</bdi>
                      {r.stressTest.durationMin && <span className="font-normal text-muted-foreground">· {r.stressTest.durationMin} دقيقة</span>}
                      <span className="ms-auto">{r.stressTest.passed ? "ناجح" : "لم يكتمل"}</span>
                    </div>
                    {r.stressTest.notes && <p className="mt-1.5 text-[13px] text-muted-foreground"><BidiText text={r.stressTest.notes} /></p>}
                  </div>
                )}
              </div>
            </Block>
          )}

          {(r.screenNotes || r.portsNotes) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {r.screenNotes && <Note title="الشاشة" body={r.screenNotes} />}
              {r.portsNotes && <Note title="المنافذ والاتصال" body={r.portsNotes} />}
            </div>
          )}

          {!compact && r.checklist.length > 0 && (
            <Block title="قائمة الفحص">
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {r.checklist.map((c) => (
                  <li key={c.key} className="flex items-start gap-2.5 text-sm">
                    <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", c.ok === true ? "bg-primary-soft text-primary-ink" : c.ok === false ? "bg-danger-soft text-danger" : "bg-surface-2 text-muted-foreground")}>
                      {c.ok === true ? <Check className="size-3" strokeWidth={3} /> : c.ok === false ? <X className="size-3" strokeWidth={3} /> : <CircleHelp className="size-3" />}
                    </span>
                    <span>{checklistLabel(c.key)}{c.note && <span className="block text-xs text-muted-foreground">{c.note}</span>}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {!compact && inspection.attachments.length > 0 && (
            <Block title="الأدلة المرفقة">
              <div className="flex flex-wrap gap-2">
                {inspection.attachments.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="group relative block w-32 overflow-hidden rounded-lg border border-border">
                    {a.kind === "pdf" ? (
                      <div className="flex aspect-[4/3] items-center justify-center bg-surface-2"><FileText className="size-8 text-muted-foreground" /></div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.url} alt={a.label ?? "مرفق الفحص"} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
                    )}
                    {a.label && <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground">{a.label}</span>}
                  </a>
                ))}
              </div>
            </Block>
          )}

          {r.agentVersion && (
            <p className="flex items-center gap-1.5 text-[12px] text-subtle-foreground" dir="ltr">
              <Fingerprint className="size-3.5" /> {r.agentVersion} · {r.checksum?.slice(0, 24)}…
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2.5 border-t border-border bg-surface-2/60 px-5 py-4 text-[12.5px] leading-relaxed text-muted-foreground sm:px-6">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>{INSPECTION_DISCLAIMER}</p>
      </div>
    </div>
  );
}

function Meta({ label, value, sub, ltr, icon }: { label: string; value: string; sub?: string; ltr?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1 font-semibold" dir={ltr ? "ltr" : undefined}>{icon}{value}</dd>
      {sub && <dd className="text-xs text-subtle-foreground">{sub}</dd>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-[13px] font-semibold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function HwRow({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold" dir="ltr" title={value}>{value}</p>
      </div>
    </div>
  );
}

function HealthBar({ value, label, wide }: { value: number; label: string; wide?: boolean }) {
  const tone = value >= 85 ? "bg-primary" : value >= 70 ? "bg-amber-500" : "bg-danger";
  return (
    <div className={cn("shrink-0", wide ? "w-full" : "w-28")}>
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-bold num">{value}%</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TempCell({ label, v, load }: { label: string; v: number; load?: boolean }) {
  const hot = load ? v >= 85 : v >= 55;
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-1 text-[11.5px] text-muted-foreground"><Thermometer className="size-3.5" />{label}</div>
      <div className={cn("mt-1 text-lg font-bold num", hot && "text-warning")} dir="ltr">{v}°C</div>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="text-[13px] font-semibold text-muted-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed"><BidiText text={body} /></p>
    </div>
  );
}

function ScoreRing({ value, total }: { value: number; total: number }) {
  const pct = total ? value / total : 0;
  const c = 2 * Math.PI * 18;
  return (
    <svg viewBox="0 0 44 44" className="size-11 -rotate-90" aria-hidden>
      <circle cx="22" cy="22" r="18" fill="none" strokeWidth="5" className="stroke-surface-2" />
      <circle cx="22" cy="22" r="18" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-primary" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
    </svg>
  );
}
