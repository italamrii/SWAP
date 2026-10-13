import { ArrowLeftRight, BadgeCheck, Lock } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { VISUAL_PREVIEW } from "@/lib/visual-preview";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <main id="main" className="flex flex-col px-5 py-6 sm:px-10 lg:order-2">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {VISUAL_PREVIEW ? (
            <div role="note" data-testid="preview-auth-disabled" className="rounded-xl border border-amber-300/70 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-100">
              <p className="font-semibold">تسجيل الدخول غير متاح في معاينة التصميم</p>
              <p className="mt-1.5">هذه نسخة توضيحية بدون قاعدة بيانات، لذلك الحسابات والمحادثات والعروض معطّلة.</p>
              <Link href="/" className="mt-3 inline-block font-semibold underline underline-offset-4">العودة لتصفّح المعاينة</Link>
            </div>
          ) : (
            children
          )}
        </div>
        <p className="text-center text-xs text-subtle-foreground">© {new Date().getFullYear()} سواب · بيع. بدّل. وثّق.</p>
      </main>
      <aside className="relative hidden overflow-hidden bg-graphite text-background lg:order-1 lg:flex lg:flex-col lg:justify-end dark:bg-surface-2 dark:text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />
        <div className="pointer-events-none absolute -top-32 -start-32 size-[520px] rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <div className="relative p-12 xl:p-16">
          <p className="text-sm font-semibold text-primary">سوق الهاردوير المستعمل في السعودية</p>
          <h2 className="mt-4 max-w-md text-4xl leading-tight font-bold text-balance">كل قطعة لها قصة. خلّ تقرير الفحص يرويها بالأرقام.</h2>
          <ul className="mt-10 space-y-4 text-[15px] opacity-85">
            <li className="flex items-center gap-3"><BadgeCheck className="size-5 text-primary" />تقارير فحص اختيارية بمستويات توثيق واضحة</li>
            <li className="flex items-center gap-3"><ArrowLeftRight className="size-5 text-primary" />عروض بدل منظّمة مع فرق السعر</li>
            <li className="flex items-center gap-3"><Lock className="size-5 text-primary" />رقمك مخفي، والتواصل داخل المنصة</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
