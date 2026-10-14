import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppealControls, GuardFlagControls, ProofControls } from "@/components/admin/guard-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { SIGNAL_COPY, signalTitle } from "@/lib/guard/rules";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getGuardQueue } from "@/server/queries/admin";

export const metadata: Metadata = { title: "SWAP Guard" };

const SUBJECT = { listing: "إعلان", user: "حساب", message: "رسالة", inspection: "تقرير فحص" } as Record<string, string>;

export default async function AdminGuard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "flags" } = await searchParams;
  const q = await getGuardQueue();
  const tabs = [["flags", "التنبيهات", q.flags.length], ["proofs", "صور الإثبات", q.proofs.length], ["appeals", "الاعتراضات", q.appeals.length]] as const;
  return (
    <div className="space-y-6">
      <PageHeader title="SWAP Guard" description="تنبيهات آلية تحتاج قرار مشرف. لا تعرض محتوى الرسائل الخاصة — الرموز والمراجع فقط." />
      <div className="flex flex-wrap gap-1">
        {tabs.map(([k, l, n]) => (
          <Link key={k} href={`/admin/guard?tab=${k}`} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium", tab === k ? "bg-graphite text-background" : "bg-surface-2 text-muted-foreground")}>
            {l}<span className="num">{n}</span>
          </Link>
        ))}
      </div>

      {tab === "flags" && (q.flags.length === 0 ? <EmptyState icon={ShieldCheck} title="لا توجد تنبيهات مفتوحة" /> : (
        <ul className="space-y-3">
          {q.flags.map((f) => (
            <li key={f.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs" data-testid="guard-flag">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={f.severity === "high" ? "danger" : "warning"}>{f.severity === "high" ? "عالي" : "متوسط"}</Badge>
                <span className="font-semibold">{SUBJECT[f.subject_type] ?? f.subject_type}</span>
                {f.listing_slug && <Link href={`/listing/${f.listing_slug}`} className="text-primary-ink hover:underline">{f.listing_title}</Link>}
                {f.username && <Link href={`/seller/${f.username}`} className="text-muted-foreground hover:underline">@{f.username}</Link>}
                {f.holding && <Badge variant="outline">يحجز النشر</Badge>}
                <span className="ms-auto text-xs text-subtle-foreground">{timeAgo(f.created_at)}</span>
              </div>
              <ul className="space-y-1 text-[13px]">
                {f.signals.map((s) => (
                  <li key={s.code}>
                    <span className="font-semibold">{signalTitle(s.code)}</span> — <span className="text-muted-foreground">{SIGNAL_COPY[s.code]?.advice}</span>
                    {s.ref?.startsWith("/") && <> · <a href={s.ref} target="_blank" rel="noreferrer" className="text-primary-ink hover:underline">الملف المطابق</a></>}
                  </li>
                ))}
              </ul>
              <GuardFlagControls flagId={f.id} />
            </li>
          ))}
        </ul>
      ))}

      {tab === "proofs" && (q.proofs.length === 0 ? <EmptyState icon={ShieldCheck} title="لا توجد صور بانتظار المراجعة" /> : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {q.proofs.map((p) => (
            <li key={p.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
              <div className="text-sm">
                <Link href={`/listing/${p.slug}`} className="font-semibold hover:underline">{p.title}</Link>
                <p className="text-xs text-muted-foreground">@{p.username} · {signalTitle(p.reason)} · {timeAgo(p.submitted_at)}</p>
              </div>
              <p className="text-sm">الكود المطلوب: <bdi dir="ltr" className="rounded bg-surface-2 px-2 py-0.5 font-mono font-bold">{p.code}</bdi></p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt={`صورة إثبات الحيازة لـ ${p.title}`} className="max-h-72 w-full rounded-xl border border-border object-contain" />
              <ProofControls proofId={p.id} />
            </li>
          ))}
        </ul>
      ))}

      {tab === "appeals" && (q.appeals.length === 0 ? <EmptyState icon={ShieldCheck} title="لا توجد اعتراضات مفتوحة" /> : (
        <ul className="space-y-3">
          {q.appeals.map((a) => (
            <li key={a.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
              <p className="text-sm"><span className="font-semibold">@{a.username}</span> · {SUBJECT[a.target_type] ?? a.target_type} · <span className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</span></p>
              {a.flag_signals && <p className="text-[13px] text-muted-foreground">التنبيه: {a.flag_signals.map((s) => signalTitle(s.code)).join("، ")} ({a.flag_status === "confirmed" ? "مؤكَّد" : "مفتوح"})</p>}
              <p className="rounded-xl bg-surface-2 p-3 text-sm leading-relaxed whitespace-pre-line">{a.reason}</p>
              <AppealControls appealId={a.id} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
