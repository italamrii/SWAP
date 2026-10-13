import { ArrowLeft, Bell, Eye, Heart, MessageSquare, Package, Plus, ShieldCheck, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/server/queries/account";
import { getUnreadCounts } from "@/server/queries/inbox";

export default async function AccountHome({ searchParams }: { searchParams: Promise<{ welcome?: string; reset?: string }> }) {
  const user = await requireUser("/account");
  const [{ stats, recent, favorites }, counts, sp] = await Promise.all([getDashboard(user.id), getUnreadCounts(user.id), searchParams]);
  const firstName = (user.displayName ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      {sp.welcome && (
        <Alert variant="success"><Sparkles /><div><b>حيّاك في سواب يا {firstName}!</b> ملفك جاهز. ابدأ بإضافة أول إعلان، أو تصفّح السوق واحفظ اللي يعجبك.</div></Alert>
      )}
      {sp.reset && <Alert variant="success">تم تحديث كلمة المرور وتسجيل خروجك من الأجهزة الأخرى.</Alert>}

      <PageHeader
        title={`مرحبًا ${firstName} 👋`}
        description="هذي نظرة سريعة على نشاطك في سواب."
        actions={<Button asChild><Link href="/account/listings/new"><Plus />أضف إعلان</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="إعلانات نشطة" value={stats.active} hint={stats.pending ? `${stats.pending} قيد المراجعة` : `${stats.sold} مُباع`} icon={<Package className="size-4" />} />
        <Stat label="مشاهدات إعلاناتك" value={stats.views.toLocaleString("en-US")} hint={`${stats.saves} حفظ في المفضلة`} icon={<Eye className="size-4" />} />
        <Stat label="رسائل غير مقروءة" value={counts.messages} hint={<Link href="/account/messages" className="text-primary-ink hover:underline">فتح الرسائل</Link>} icon={<MessageSquare className="size-4" />} />
        <Stat label="عروض بانتظار ردك" value={counts.offers} hint={<Link href="/account/offers" className="text-primary-ink hover:underline">مراجعة العروض</Link>} icon={<Tag className="size-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">آخر النشاطات</h2>
            <Link href="/account/notifications" className="text-[13px] font-medium text-primary-ink hover:underline">كل التنبيهات</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState compact icon={Bell} title="لا توجد نشاطات بعد" description="أول ما يراسلك أحد أو يقدّم عرضًا على إعلانك، بتلقاه هنا." />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((n) => (
                <li key={n.id}>
                  <Link href={n.href ?? "/account/notifications"} className="flex items-start gap-3 py-3 transition hover:opacity-80">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-border-strong" : "bg-primary")} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{n.body}</p>}
                    </div>
                    <time className="shrink-0 text-xs text-subtle-foreground">{timeAgo(n.createdAt)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          {stats.unverified > 0 && (
            <Link href="/account/verification" className="group block rounded-2xl border border-primary/25 bg-primary-soft/50 p-5 transition hover:border-primary/50">
              <ShieldCheck className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">وثّق {stats.unverified === 1 ? "إعلانك" : `${stats.unverified} من إعلاناتك`}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">الإعلانات اللي فيها تقرير فحص تبني ثقة أسرع وتتصدّر نتائج «الموثّقة أولًا».</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary-ink">ابدأ التوثيق <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" /></span>
            </Link>
          )}
          <Link href="/account/favorites" className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs transition hover:border-border-strong">
            <span className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-500/10"><Heart className="size-5" /></span>
            <div className="text-sm"><p className="font-semibold">{favorites} إعلان محفوظ</p><p className="text-[13px] text-muted-foreground">ننبّهك إذا نزل السعر</p></div>
          </Link>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h3 className="text-sm font-semibold">نصيحة لبيع أسرع</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">صوّر القطعة في إضاءة نهارية من 4 زوايا على الأقل، وأضف لقطة من أداة فحص. الإعلانات المكتملة تتلقى ردودًا أكثر بشكل واضح.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
