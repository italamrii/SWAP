import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/shared/content-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "عن سواب", description: "سواب سوق سعودي متخصص في الهاردوير المستعمل، بنيناه لنحل مشكلة الثقة في بيع وشراء القطع التقنية." };

export default function AboutPage() {
  return (
    <ContentPage eyebrow="عن سواب" title="بنينا السوق اللي كنا نتمنى نلقاه." intro="سواب بدأ من تجربة نعرفها كلنا: تبي تبيع كرت أو تشتري لابتوب مستعمل، فتضيع بين إعلانات عامة بلا مواصفات، وصور مكررة، ووعود «نظيف وما فيه شي».">
      <div className="prose-swap">
        <h2>وش نسوي؟</h2>
        <p>سواب سوق إلكتروني سعودي <strong>متخصص فقط</strong> في أجهزة الكمبيوتر واللابتوبات وقطع التجميع والإكسسوارات المستعملة. نربط البائع بالمشتري مباشرة، ولا نملك المنتجات المعروضة.</p>
        <h2>وش اللي يميزنا؟</h2>
        <ul>
          <li><strong>مواصفات منظّمة لكل قسم</strong> تخلي المقارنة عادلة والبحث دقيقًا.</li>
          <li><strong>البدل كخاصية أساسية</strong>، مع فرق السعر في الاتجاهين.</li>
          <li><strong>تقارير فحص اختيارية</strong> بمستويات توثيق واضحة لا تبالغ.</li>
          <li><strong>خصوصية افتراضية</strong>: التواصل داخل المنصة ورقمك مخفي.</li>
        </ul>
        <h2>مبادئنا</h2>
        <ul>
          <li>الشفافية قبل النمو: ما نسمّي شي «موثّق» إلا إذا عندنا دليل.</li>
          <li>تصميم يحترم وقتك: صفحات سريعة، ونصوص عربية واضحة.</li>
          <li>مجتمع قبل كل شي: الجيمرز والمجمّعين هم سبب وجود سواب.</li>
        </ul>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild><Link href="/browse">تصفّح السوق</Link></Button>
        <Button asChild variant="outline"><Link href="/contact">تواصل معنا</Link></Button>
      </div>
    </ContentPage>
  );
}
