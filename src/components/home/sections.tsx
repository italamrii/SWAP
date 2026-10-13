import {
  ArrowLeftRight, BadgeCheck, Camera, ClipboardCheck, Eye, FileCheck2, Handshake, Layers3, Lock, MapPinned, MessageSquareText, ScanSearch, ShieldCheck, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VERIFICATION_META } from "@/lib/catalog/verification";

export function WhySwap() {
  const items = [
    { icon: Layers3, title: "متخصص في الهاردوير فقط", body: "ما فيه سيارات ولا أثاث. كل شيء هنا كمبيوتر وقطعه، فتلقى اللي تبيه أسرع وتوصل لمشترين يفهمون قيمته." },
    { icon: ClipboardCheck, title: "مواصفات منظّمة لكل قسم", body: "الكرت له VRAM وسجل تعدين، واللابتوب له صحة بطارية ومعدل تحديث. مقارنة عادلة بدل «نظيف وما فيه شي»." },
    { icon: ArrowLeftRight, title: "البدل صار منظّم", body: "اقترح بدل بقطعتك مع فرق السعر بأي اتجاه، والبائع يقبل أو يرفض أو يناقش، وكل شيء موثّق داخل المحادثة." },
    { icon: ShieldCheck, title: "تقارير فحص ترفع الثقة", body: "أرفق تقرير فحص لجهازك من أداة سواب أو متجر شريك، وخلّ الأرقام تتكلم: الحرارة، صحة القرص، اختبار الضغط." },
  ];
  return (
    <section className="container-page pt-20 sm:pt-28">
      <div className="max-w-2xl">
        <div className="mb-2 text-xs font-semibold text-primary-ink">ليش سواب؟</div>
        <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-[32px] sm:leading-tight">سوق يفهم الفرق بين <bdi>RTX 4070</bdi> و <bdi>4070 Super</bdi>.</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">صممنا سواب للي يبيعون ويشترون القطع التقنية بجدية: جيمرز، مجمّعين، طلاب، ومحبي التقنية.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-xl border border-border bg-surface p-5 shadow-xs">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
              <it.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VerificationExplainer() {
  const steps = [
    { icon: ScanSearch, title: "افحص جهازك", body: "شغّل أداة سواب للفحص، أو عبّئ نموذج الفحص المنظّم وأرفق لقطات من أدوات مثل CrystalDiskInfo وHWiNFO." },
    { icon: Camera, title: "صورة التحقق", body: "نعطيك كود فريد تكتبه على ورقة وتصوّره جنب الجهاز — دليل إن القطعة فعلًا عندك." },
    { icon: FileCheck2, title: "مراجعة الفريق", body: "يراجع فريق سواب التقرير للتأكد من اكتماله واتساقه، ثم يظهر مستوى التوثيق على إعلانك." },
  ];
  const levels = (["seller_report", "platform_checked", "partner_verified"] as const).map((l) => ({ key: l, ...VERIFICATION_META[l] }));
  return (
    <section className="container-page pt-20 sm:pt-28">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="p-6 sm:p-10">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-ink"><BadgeCheck className="size-4" />التوثيق والفحص</div>
            <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-[30px] sm:leading-tight">خلّ تقرير الفحص يجاوب قبل ما يسأل المشتري.</h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              تقرير الفحص اختياري، لكنه يفرق: الإعلانات الموثّقة تظهر بشارة واضحة، وتقدر تتصدر نتائج «الموثّقة أولًا».
            </p>
            <ol className="mt-8 space-y-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-[15px] font-semibold"><s.icon className="size-4 text-primary" aria-hidden />{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Button asChild variant="outline" className="mt-8"><Link href="/verification">تعرّف على سياسة التوثيق</Link></Button>
          </div>
          <div className="relative border-t border-border bg-background/60 p-6 sm:p-10 lg:border-t-0 lg:border-s">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden />
            <div className="relative space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">مستويات التوثيق</p>
              {levels.map((l, i) => (
                <div key={l.key} className="rounded-xl border border-border bg-surface p-4 shadow-xs" style={{ marginInlineStart: `${i * 12}px` }}>
                  <div className="flex items-center gap-2">
                    <span className={i === 2 ? "flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground" : i === 1 ? "flex size-7 items-center justify-center rounded-md bg-primary-soft text-primary-ink" : "flex size-7 items-center justify-center rounded-md bg-info-soft text-info-ink"}>
                      {i === 2 ? <BadgeCheck className="size-4" /> : i === 1 ? <ShieldCheck className="size-4" /> : <FileCheck2 className="size-4" />}
                    </span>
                    <span className="text-sm font-semibold">{l.label}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{l.description}</p>
                </div>
              ))}
              <p className="pt-2 text-[12px] leading-relaxed text-subtle-foreground">
                يعكس التقرير حالة الجهاز وقت الفحص ولا يُعد ضمانًا مطلقًا. ننصح دائمًا بالمعاينة قبل الدفع.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SwapShowcase() {
  return (
    <section className="container-page pt-20 sm:pt-28">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-swap-ink"><ArrowLeftRight className="size-4" /> اقتراح بدل</div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-xl bg-surface-2 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">تعطيه</p>
                <p className="mt-1 text-sm font-semibold"><bdi>RTX 3070 Ti</bdi></p>
                <p className="text-[11px] text-muted-foreground">ممتاز</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-swap text-white"><ArrowLeftRight className="size-4" /></span>
              <div className="rounded-xl bg-surface-2 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">تاخذ</p>
                <p className="mt-1 text-sm font-semibold"><bdi>RX 7800 XT</bdi></p>
                <p className="text-[11px] text-muted-foreground">كالجديد</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-swap/40 bg-swap-soft px-4 py-3">
              <span className="text-[13px] text-swap-ink">فرق تدفعه أنت</span>
              <span className="font-bold text-swap-ink"><bdi>350</bdi> ر.س</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px] font-semibold">
              <span className="rounded-md bg-primary py-2 text-primary-foreground">قبول</span>
              <span className="rounded-md bg-surface-2 py-2">نقاش</span>
              <span className="rounded-md bg-surface-2 py-2 text-danger">رفض</span>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="mb-2 text-xs font-semibold text-swap-ink">البدل في سواب</div>
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-[30px] sm:leading-tight">بدّل بدون فوضى الرسائل.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            البائع يحدد إذا يقبل البدل وش يدوّر عليه. وأنت تقدّم عرض منظّم: وش تعطيه، حالته، وفرق السعر — سواء تدفعه أو تستلمه. الرد بضغطة، والسجل محفوظ في المحادثة.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {["فرق سعر في الاتجاهين", "اربط العرض بإعلانك الحالي في سواب", "تنبيه فوري للبائع عند كل عرض"].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><span className="flex size-5 items-center justify-center rounded-full bg-swap-soft text-swap-ink"><Sparkles className="size-3" /></span>{t}</li>
            ))}
          </ul>
          <Button asChild variant="swap" className="mt-7"><Link href="/browse?swap=1">تصفّح إعلانات البدل</Link></Button>
        </div>
      </div>
    </section>
  );
}

export function SafetySection() {
  const tips = [
    { icon: MapPinned, title: "قابل في مكان عام", body: "اختر مكانًا عامًا مزدحمًا ومراقبًا، ويفضّل في النهار." },
    { icon: Eye, title: "افحص قبل الدفع", body: "شغّل القطعة وتأكد من المواصفات بنفسك، وطابقها مع تقرير الفحص." },
    { icon: Lock, title: "لا تحوّل عربون", body: "لا تحوّل أي مبلغ قبل المعاينة، مهما كان العرض مغريًا." },
    { icon: MessageSquareText, title: "خلّ التواصل في سواب", body: "رقمك مخفي افتراضيًا، والمحادثة داخل المنصة تحفظ حقك عند أي بلاغ." },
  ];
  return (
    <section className="container-page pt-20 sm:pt-28">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 text-xs font-semibold text-primary-ink">الأمان أولًا</div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-[30px]">صفقة آمنة تبدأ من هنا</h2>
        </div>
        <Link href="/safety" className="text-sm font-semibold text-primary-ink hover:underline underline-offset-4">كل نصائح الأمان</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tips.map((t) => (
          <div key={t.title} className="flex gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs sm:flex-col sm:gap-0">
            <t.icon className="size-6 shrink-0 text-foreground" aria-hidden />
            <div>
              <h3 className="text-[15px] font-semibold sm:mt-4">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SellCta() {
  return (
    <section className="container-page pt-20 sm:pt-28">
      <div className="relative overflow-hidden rounded-2xl bg-graphite px-6 py-12 text-background sm:px-12 sm:py-16 dark:bg-surface-2 dark:text-foreground">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-grid" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -end-24 size-80 rounded-full bg-primary/40 blur-3xl" aria-hidden />
        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-[34px] sm:leading-tight">عندك قطعة ما تستخدمها؟ خلّها تشتغل لك.</h2>
            <p className="mt-3 text-[15px] leading-relaxed opacity-75">
              أضف إعلانك في أقل من 3 دقائق. المواصفات تتعبّى حسب القسم، والإعلان مجاني بالكامل.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/account/listings/new"><Handshake />ابدأ البيع اليوم</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-inherit hover:bg-white/10"><Link href="/how-it-works">كيف يعمل سواب</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
