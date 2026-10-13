import { ArrowLeftRight, Camera, ClipboardList, Handshake, MessageCircle, Search, ShieldCheck, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/shared/content-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "كيف يعمل سواب", description: "دليل سريع للبيع والشراء والبدل في سواب، وكيف تعمل تقارير الفحص." };

const BUY = [
  { icon: Search, t: "ابحث بالمواصفات", d: "فلتر حسب VRAM، سوكت المعالج، صحة البطارية، المدينة، ومستوى التوثيق." },
  { icon: ShieldCheck, t: "اقرأ تقرير الفحص", d: "إذا كان الإعلان موثّقًا، شوف الحرارة واختبار الضغط وصحة القرص قبل ما تتواصل." },
  { icon: MessageCircle, t: "تواصل داخل سواب", d: "اسأل البائع، قدّم عرض سعر، أو اقترح بدل — رقمك يبقى مخفيًا." },
  { icon: Handshake, t: "عاين واستلم بأمان", d: "قابل في مكان عام، شغّل القطعة، وبعدها ادفع." },
];
const SELL = [
  { icon: ClipboardList, t: "اختر القسم وعبّئ المواصفات", d: "نجهّز لك حقول القسم المناسبة، فيكون إعلانك واضحًا وقابلًا للفلترة." },
  { icon: Camera, t: "صوّر بوضوح", d: "4 صور على الأقل في إضاءة جيدة، ونحذف بيانات الموقع من الصور تلقائيًا." },
  { icon: Tag, t: "حدد السعر وخيارات البدل", d: "فعّل التفاوض أو البدل، واكتب وش تدوّر عليه." },
  { icon: ShieldCheck, t: "وثّق إعلانك (اختياري)", d: "أرفق تقرير فحص مع كود التحقق، ويحصل إعلانك على شارة توثيق بعد المراجعة." },
];

export default function HowItWorksPage() {
  return (
    <ContentPage eyebrow="كيف يعمل سواب" title="سوق مصمم للهاردوير، من أول بحث إلى آخر تسليم." intro="سواب يربط البائع بالمشتري مباشرة. ما نملك المنتجات ولا نتدخل في الدفع، لكن نعطيكم أدوات تخلي الصفقة أوضح وأأمن.">
      <div className="grid gap-10 lg:grid-cols-2">
        {[{ title: "للمشتري", items: BUY }, { title: "للبائع", items: SELL }].map((g) => (
          <section key={g.title}>
            <h2 className="mb-5 text-xl font-bold">{g.title}</h2>
            <ol className="space-y-4">
              {g.items.map((s, i) => (
                <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink"><s.icon className="size-5" /></span>
                  <div>
                    <h3 className="font-semibold"><span className="text-subtle-foreground num">{i + 1}.</span> {s.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <section className="mt-14 rounded-2xl border border-swap/25 bg-swap-soft p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-xl font-bold text-swap-ink"><ArrowLeftRight className="size-5" />كيف يشتغل البدل؟</h2>
        <div className="prose-swap mt-2">
          <ol>
            <li>البائع يفعّل «أقبل البدل» ويكتب وش يدوّر عليه.</li>
            <li>تقدّم «اقتراح بدل»: القطعة اللي تعرضها، حالتها، وفرق السعر — تدفعه أنت أو تستلمه.</li>
            <li>تقدر تربط الاقتراح بإعلانك في سواب ليشوف البائع صورها ومواصفاتها.</li>
            <li>البائع يقبل أو يرفض أو يكمل النقاش في المحادثة، والعرض صالح 5 أيام.</li>
            <li>بعد القبول، تتفقون على المعاينة والتسليم في مكان عام.</li>
          </ol>
        </div>
      </section>
      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href="/browse">ابدأ التصفح</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/account/listings/new">أضف إعلانك</Link></Button>
      </div>
    </ContentPage>
  );
}
