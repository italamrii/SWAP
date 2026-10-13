import type { Metadata } from "next";
import { AreaChart, BarList } from "@/components/admin/charts";
import { PageHeader } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { cityLabel } from "@/lib/catalog/cities";
import { VERIFICATION_META, type VerificationLevel } from "@/lib/catalog/verification";
import { getAnalytics } from "@/server/queries/admin";

export const metadata: Metadata = { title: "التحليلات" };

export default async function AdminAnalytics() {
  const a = await getAnalytics();
  const totalActive = a.levels.reduce((s, l) => s + l.count, 0);
  const verified = a.levels.filter((l) => l.level !== "unverified").reduce((s, l) => s + l.count, 0);
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  return (
    <div className="space-y-6">
      <PageHeader title="التحليلات" description="مؤشرات صحة السوق خلال آخر 30 يومًا." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="نسبة الإعلانات الموثّقة" value={`${pct(verified, totalActive)}%`} hint={`${verified} من ${totalActive}`} />
        <Stat label="محادثات" value={a.funnel.conversations} />
        <Stat label="عروض (مقبولة)" value={`${a.funnel.offers} (${a.funnel.accepted})`} hint={`نسبة القبول ${pct(a.funnel.accepted, a.funnel.offers)}%`} />
        <Stat label="صفقات مكتملة (مُباع)" value={a.funnel.sold} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <h2 className="mb-4 font-semibold">مشاهدات الإعلانات اليومية</h2>
          <AreaChart label="المشاهدات اليومية" data={a.views.map((v) => ({ x: v.day.slice(5), y: v.views }))} />
        </section>
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <h2 className="mb-4 font-semibold">التسجيلات الجديدة</h2>
          <AreaChart label="التسجيلات اليومية" data={a.signups.map((v) => ({ x: v.day.slice(5), y: v.n }))} />
        </section>
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <h2 className="mb-4 font-semibold">الإعلانات النشطة حسب القسم</h2>
          <BarList data={a.byCategory.map((c) => ({ label: c.name, value: c.count }))} />
        </section>
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h2 className="mb-4 font-semibold">مستويات التوثيق</h2>
            <BarList data={(["unverified", "seller_report", "platform_checked", "partner_verified"] as VerificationLevel[]).map((l) => ({ label: VERIFICATION_META[l].short, value: a.levels.find((x) => x.level === l)?.count ?? 0 }))} />
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h2 className="mb-4 font-semibold">أكثر المدن نشاطًا</h2>
            <BarList data={a.cities.map((c) => ({ label: cityLabel(c.city), value: c.count }))} />
          </section>
        </div>
      </div>
    </div>
  );
}
