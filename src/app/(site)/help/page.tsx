import { ArrowLeftRight, ChevronDown, CircleUser, HandCoins, Search, ShieldCheck, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/shared/content-page";

export const metadata: Metadata = { title: "مركز المساعدة", description: "إجابات سريعة عن البيع والشراء والبدل وتقارير الفحص والحساب في سواب." };

const SECTIONS = [
  {
    id: "buying", title: "الشراء", icon: Search,
    faqs: [
      ["كيف أبحث عن قطعة بمواصفات محددة؟", "اختر القسم ثم استخدم الفلاتر الجانبية (مثل الذاكرة VRAM أو السوكت أو صحة البطارية). كل فلتر يُظهر عدد الإعلانات المطابقة، ورابط الصفحة يحفظ بحثك لتشاركه."],
      ["هل يضمن سواب حالة القطعة؟", "لا. سواب منصة وسيطة. تقرير الفحص — إن وُجد — دليل يرفع الثقة ولا يُعد ضمانًا. عاين القطعة دائمًا قبل الدفع."],
      ["كيف أتواصل مع البائع؟", "من صفحة الإعلان اضغط «راسل البائع». رقمك يبقى مخفيًا، والمحادثة محفوظة في «المحادثات»."],
    ],
  },
  {
    id: "selling", title: "البيع", icon: Tag,
    faqs: [
      ["كم يكلف نشر إعلان؟", "النشر مجاني بالكامل حاليًا."],
      ["لماذا إعلاني «قيد المراجعة»؟", "أول إعلانين للحسابات الجديدة يراجعهما الفريق للحد من الاحتيال، وعادةً خلال ساعات. البائعون الموثوقون ينشرون مباشرة."],
      ["كيف أعدّل السعر؟", "من «إعلاناتي» اختر الإعلان ثم «تعديل». إذا خفّضت السعر نبلّغ من حفظ إعلانك في المفضلة."],
    ],
  },
  {
    id: "offers", title: "العروض", icon: HandCoins,
    faqs: [
      ["ما الفرق بين عرض السعر والرسالة؟", "عرض السعر منظّم: مبلغ محدد يصل للبائع ليقبله أو يرفضه، وصالح 5 أيام. تقدر تسحبه قبل الرد."],
      ["ماذا يحدث بعد قبول العرض؟", "تظهر رسالة في المحادثة، وتتفقان على المعاينة والتسليم في مكان عام. سواب لا يستلم أي مبالغ."],
    ],
  },
  {
    id: "swap", title: "البدل", icon: ArrowLeftRight,
    faqs: [
      ["كيف أقترح بدلًا؟", "في الإعلانات التي تقبل البدل اضغط «اقترح بدل»، واكتب القطعة التي تعرضها وحالتها وفرق السعر إن وجد. تقدر تربطه بإعلانك في سواب."],
      ["من يدفع فرق السعر؟", "تحدد ذلك في الاقتراح: «أدفع فرق» أو «يدفع لي فرق» أو «بدون فرق»."],
    ],
  },
  {
    id: "inspection", title: "الفحص والتوثيق", icon: ShieldCheck,
    faqs: [
      ["ما معنى شارات التوثيق؟", "«تقرير البائع» يعني بيانات وأدلة من البائع راجعها الفريق، و«فحص المنصة» بيانات من أداة سواب، و«شريك معتمد» فحص فعلي لدى متجر شريك. التفاصيل في صفحة التوثيق."],
      ["ما هو كود التحقق؟", "كود فريد لكل تقرير يكتبه البائع على ورقة ويصوّره بجانب الجهاز، ليثبت أن القطعة بحوزته وقت الفحص."],
    ],
  },
  {
    id: "account", title: "الحساب والخصوصية", icon: CircleUser,
    faqs: [
      ["هل يظهر رقم جوالي؟", "لا، إلا إذا فعّلت «إظهار رقمي» من الإعدادات، وحتى عندها يظهر للمسجلين فقط."],
      ["كيف أحذف حسابي؟", "من «الإعدادات» ثم «حذف الحساب». يُحذف حسابك وإعلاناتك ومحادثاتك نهائيًا."],
    ],
  },
] as const;

export default function HelpPage() {
  return (
    <ContentPage eyebrow="مركز المساعدة" title="كيف نقدر نساعدك؟" intro="إجابات مختصرة لأكثر الأسئلة شيوعًا. ما لقيت جوابك؟ تواصل معنا وبنرد خلال يوم عمل.">
      <nav aria-label="أقسام المساعدة" className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3 text-sm font-semibold transition hover:border-border-strong">
            <s.icon className="size-4 text-primary" aria-hidden />{s.title}
          </a>
        ))}
      </nav>
      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-32" aria-labelledby={`${s.id}-h`}>
            <h2 id={`${s.id}-h`} className="mb-3 flex items-center gap-2 text-lg font-bold"><s.icon className="size-5 text-primary" aria-hidden />{s.title}</h2>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {s.faqs.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="size-4 shrink-0 text-subtle-foreground transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        لم تجد إجابتك؟ <Link href="/contact" className="font-semibold text-primary-ink hover:underline">تواصل مع فريق سواب</Link> أو اطّلع على <Link href="/safety" className="font-semibold text-primary-ink hover:underline">نصائح الأمان</Link>.
      </p>
    </ContentPage>
  );
}
