import { ArrowLeft, Flag, MessageSquare, Package, ShieldCheck, Tag, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { timeAgo } from "@/lib/format";
import { getAdminOverview } from "@/server/queries/admin";

const ACTIONS: Record<string, string> = {
  "listing.approve": "اعتمد إعلانًا", "listing.reject": "رفض إعلانًا", "listing.hide": "أخفى إعلانًا", "listing.restore": "أعاد نشر إعلان",
  "inspection.approve": "اعتمد تقرير فحص", "inspection.reject": "رفض تقرير فحص", "verification.revoke": "سحب توثيق إعلان",
  "report.resolve": "عالج بلاغًا", "report.dismiss": "رفض بلاغًا", "report.reviewing": "بدأ مراجعة بلاغ",
  "user.suspend": "أوقف مستخدمًا", "user.unsuspend": "أعاد تفعيل مستخدم", "user.ban": "حظر مستخدمًا", "user.trust": "وثّق بائعًا", "user.untrust": "ألغى توثيق بائع",
  "user.make_moderator": "عيّن مشرفًا", "user.make_user": "ألغى صلاحية مشرف", "category.update": "عدّل قسمًا", "category.create": "أضاف قسمًا", "banner.create": "أضاف إعلانًا ترويجيًا", "banner.update": "عدّل إعلانًا ترويجيًا", "banner.delete": "حذف إعلانًا ترويجيًا",
};

export default async function AdminHome() {
  const { counts, audit } = await getAdminOverview();
  const queues = [
    { href: "/admin/listings?status=pending_review", label: "إعلانات بانتظار المراجعة", n: counts.pending, icon: Package },
    { href: "/admin/inspections", label: "تقارير فحص بانتظار المراجعة", n: counts.pendingInspections, icon: ShieldCheck },
    { href: "/admin/reports", label: "بلاغات مفتوحة", n: counts.openReports, icon: Flag },
  ];
  return (
    <div className="space-y-8">
      <PageHeader title="لوحة التحكم" description="نظرة سريعة على صحة السوق وطوابير الإشراف." />
      <div className="grid gap-3 sm:grid-cols-3">
        {queues.map((q) => (
          <Link key={q.href} href={q.href} className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-border-strong">
            <span className={`flex size-11 items-center justify-center rounded-xl ${q.n ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" : "bg-primary-soft text-primary-ink"}`}><q.icon className="size-5" /></span>
            <div className="flex-1"><p className="text-2xl font-bold num">{q.n}</p><p className="text-[13px] text-muted-foreground">{q.label}</p></div>
            <ArrowLeft className="size-4 text-subtle-foreground transition group-hover:-translate-x-0.5" />
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="المستخدمون" value={counts.users} hint={`+${counts.newUsers} هذا الأسبوع`} icon={<Users className="size-4" />} />
        <Stat label="إعلانات نشطة" value={counts.active} hint={`${counts.verified} موثّق · ${counts.swap} يقبل البدل`} icon={<Package className="size-4" />} />
        <Stat label="رسائل آخر 24 ساعة" value={counts.messagesToday} icon={<MessageSquare className="size-4" />} />
        <Stat label="عروض هذا الأسبوع" value={counts.offersWeek} icon={<Tag className="size-4" />} />
      </div>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <h2 className="mb-4 font-semibold">سجل الإجراءات الإدارية</h2>
        {audit.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد إجراءات بعد.</p> : (
          <ul className="divide-y divide-border text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <span><b>{a.actorName ?? "النظام"}</b> {ACTIONS[a.action] ?? a.action}{typeof a.meta?.note === "string" && a.meta.note ? <span className="text-muted-foreground"> — {a.meta.note}</span> : null}</span>
                <time className="shrink-0 text-xs text-subtle-foreground">{timeAgo(a.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
