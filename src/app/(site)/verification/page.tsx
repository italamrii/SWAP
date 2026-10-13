import { BadgeCheck, FileCheck2, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { Metadata } from "next";
import { ContentPage } from "@/components/shared/content-page";
import { INSPECTION_DISCLAIMER, INSPECTION_VALIDITY_DAYS, VERIFICATION_META } from "@/lib/catalog/verification";

export const metadata: Metadata = { title: "التوثيق وتقارير الفحص", description: "كيف تعمل تقارير الفحص ومستويات التوثيق في سواب، وما الذي تعنيه كل شارة." };

const LEVELS = [
  { k: "unverified", icon: ShieldQuestion, cls: "bg-surface-2 text-muted-foreground" },
  { k: "seller_report", icon: FileCheck2, cls: "bg-info-soft text-info-ink" },
  { k: "platform_checked", icon: ShieldCheck, cls: "bg-primary-soft text-primary-ink" },
  { k: "partner_verified", icon: BadgeCheck, cls: "bg-primary text-primary-foreground" },
] as const;

export default function VerificationPolicyPage() {
  return (
    <ContentPage
      eyebrow="التوثيق والفحص"
      title="شارات واضحة، بدون مبالغة."
      intro="تقرير الفحص في سواب دليل يرفع الثقة، وليس ضمانًا. لذلك نوضح لكل إعلان من فحص الجهاز ومتى وكيف، ونترك لك الحكم."
      toc={[{ id: "levels", label: "مستويات التوثيق" }, { id: "how", label: "كيف نراجع التقارير" }, { id: "code", label: "كود التحقق" }, { id: "policy", label: "سياسة التوثيق" }, { id: "agent", label: "أداة سواب للفحص" }]}
    >
      <section id="levels" className="scroll-mt-28">
        <h2 className="mb-4 text-xl font-bold">مستويات التوثيق</h2>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {LEVELS.map(({ k, icon: Icon, cls }) => (
            <div key={k} className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${cls}`}><Icon className="size-4" />{VERIFICATION_META[k].label}</span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{VERIFICATION_META[k].description}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="prose-swap">
        <h2 id="how">كيف نراجع التقارير</h2>
        <ul>
          <li>نتحقق من وجود <strong>صورة الجهاز مع كود التحقق</strong> الخاص بالتقرير.</li>
          <li>نقارن بيانات التقرير بمواصفات الإعلان (الموديل، السعة، صحة البطارية…) ونطلب التوضيح عند وجود تعارض.</li>
          <li>نراجع لقطات أدوات الفحص ونتائج اختبار الضغط إن وجدت.</li>
          <li>نمنح أعلى مستوى <strong>تدعمه الأدلة فقط</strong>؛ فالتقرير اليدوي لا يمكن أن يحصل على «فحص المنصة».</li>
        </ul>
        <h2 id="code">كود التحقق</h2>
        <p>لكل تقرير كود فريد (مثل <bdi>SW-7K2Q</bdi>) يكتبه البائع على ورقة ويصوّرها بجانب الجهاز وهو يعمل. هذا يثبت أن القطعة بحوزته وقت الفحص، ويقلل الإعلانات المنسوخة أو المسروقة الصور. يظهر الكود في التقرير المنشور، فتقدر تطابقه مع الصورة بنفسك.</p>
        <h2 id="policy">سياسة التوثيق</h2>
        <ol>
          <li>تقرير الفحص اختياري ولا يؤثر على حق أي بائع في النشر.</li>
          <li>يُعتبر التقرير حديثًا لمدة {INSPECTION_VALIDITY_DAYS} يومًا من تاريخ الفحص، وبعدها يظهر بعلامة «تقرير قديم».</li>
          <li>تغيير قسم الإعلان يلغي التوثيق الحالي، ويمكن للبائع تحديث التقرير في أي وقت.</li>
          <li>يحق لسواب سحب التوثيق إذا ثبت عدم صحة البيانات، مع إيقاف الحساب في حالات التضليل المتعمد.</li>
          <li>المتاجر الشريكة تفحص الأجهزة وفق قائمة فحص موحّدة، وتتحمل مسؤولية تقاريرها أمام سواب.</li>
        </ol>
        <blockquote>{INSPECTION_DISCLAIMER}</blockquote>
        <h2 id="agent">أداة سواب للفحص (قريبًا)</h2>
        <p>نعمل على تطبيق لسطح المكتب يجمع مواصفات الجهاز وصحة الأقراص والحرارة ونتائج اختبار ضغط قصير، ثم يرسلها مباشرة إلى تقرير إعلانك مع بصمة رقمية تمنع التعديل. التقارير القادمة من الأداة فقط تؤهل لمستوى «فحص المنصة».</p>
      </div>
    </ContentPage>
  );
}
