import { and, desc, eq } from "drizzle-orm";
import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUARD_DISCLAIMER } from "@/components/guard/guard-ui";
import { AppealForm, ProofUpload } from "@/components/guard/seller-guard-forms";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { appeals, guardFlags, listings, possessionProofs } from "@/lib/db/schema";
import { SIGNAL_COPY } from "@/lib/guard/rules";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "مراجعة SWAP Guard" };

const PROOF_STATUS = { requested: "مطلوبة", submitted: "قيد المراجعة", approved: "مقبولة", rejected: "مرفوضة" } as const;

export default async function ListingGuardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const user = await requireUser(`/account/listings/${id}/guard`);
  const [l] = await db.select({ id: listings.id, title: listings.title, status: listings.status, slug: listings.slug, note: listings.moderationNote }).from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, user.id))).limit(1);
  if (!l) notFound();
  const [flags, proofs, myAppeals] = await Promise.all([
    db.select().from(guardFlags).where(and(eq(guardFlags.subjectType, "listing"), eq(guardFlags.subjectId, id))).orderBy(desc(guardFlags.createdAt)),
    db.select().from(possessionProofs).where(eq(possessionProofs.listingId, id)).orderBy(desc(possessionProofs.createdAt)),
    db.select().from(appeals).where(and(eq(appeals.targetType, "listing"), eq(appeals.targetId, id), eq(appeals.userId, user.id))).orderBy(desc(appeals.createdAt)),
  ]);
  const active = flags.find((f) => f.status === "open") ?? flags.find((f) => f.status === "confirmed");
  const openProof = proofs.find((p) => p.status === "requested");
  const appealOpen = myAppeals.some((a) => a.status === "open" && a.flagId === active?.id);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="مراجعة SWAP Guard" description={<>الإعلان: <Link href={`/listing/${l.slug}`} className="font-medium text-foreground hover:underline">{l.title}</Link></>} />

      {!active ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
          <ShieldCheck className="size-6 shrink-0 text-primary" />
          <p className="text-sm">لا توجد مراجعة مفتوحة من SWAP Guard على هذا الإعلان.{l.status === "pending_review" && " الإعلان في قائمة المراجعة الاعتيادية."}</p>
        </div>
      ) : (
        <section className="rounded-2xl border border-amber-300/70 bg-amber-50/60 p-5 dark:border-amber-500/30 dark:bg-amber-950/30" data-testid="guard-case">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldAlert className="size-5 text-warning" />{active.status === "confirmed" ? "قرار المراجعة: لم يُنشر الإعلان" : "الإعلان محجوز للمراجعة قبل النشر"}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {active.signals.map((s) => (
              <li key={s.code}><span className="font-semibold">{SIGNAL_COPY[s.code]?.title ?? s.code}</span> — <span className="text-muted-foreground">{SIGNAL_COPY[s.code]?.advice}</span></li>
            ))}
          </ul>
          {active.status === "confirmed" && active.reviewNote && <p className="mt-3 text-sm">ملاحظة المشرف: {active.reviewNote}</p>}
          <p className="mt-3 text-xs text-muted-foreground">رُصد في {formatDate(active.createdAt)}. لا يمكن تجاوز هذه المراجعة بتعديل الإعلان؛ يقرّر فيها مشرف من فريق سواب.</p>
        </section>
      )}

      {openProof && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5" data-testid="possession-proof">
          <h2 className="font-semibold">صورة إثبات الحيازة</h2>
          <ol className="list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground">
            <li>اكتب هذا الكود بخط واضح على ورقة: <bdi dir="ltr" className="rounded bg-surface-2 px-2 py-0.5 font-mono text-base font-bold text-foreground" data-testid="proof-code">{openProof.code}</bdi></li>
            <li>صوّر القطعة نفسها والورقة بجانبها في صورة واحدة.</li>
            <li>ارفع الصورة هنا. يستخدم الكود مرة واحدة فقط.</li>
          </ol>
          <p className="text-xs text-muted-foreground">الصورة تساعد المشرف على التأكد أن القطعة بين يديك الآن؛ لا تعني توثيق ملكيتها أو حالتها.</p>
          <ProofUpload proofId={openProof.id} />
        </section>
      )}

      {proofs.some((p) => p.status !== "requested") && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 font-semibold">سجل صور الإثبات</h2>
          <ul className="space-y-1.5 text-sm">
            {proofs.filter((p) => p.status !== "requested").map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2"><Clock className="size-3.5 text-muted-foreground" />{formatDate(p.submittedAt ?? p.createdAt)} — {PROOF_STATUS[p.status]}{p.reviewNote && <span className="text-muted-foreground">({p.reviewNote})</span>}</li>
            ))}
          </ul>
        </section>
      )}

      {active && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">الاعتراض</h2>
          {appealOpen ? <p className="text-sm text-muted-foreground" data-testid="appeal-open">اعتراضك قيد المراجعة. سنبلغك بالنتيجة.</p> : <AppealForm flagId={active.id} />}
          {myAppeals.filter((a) => a.status !== "open").map((a) => (
            <p key={a.id} className="text-sm text-muted-foreground">{formatDate(a.createdAt)}: {a.status === "accepted" ? "قُبل" : "لم يُقبل"} — {a.reviewNote}</p>
          ))}
        </section>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{GUARD_DISCLAIMER}</p>
    </div>
  );
}
