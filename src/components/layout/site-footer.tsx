import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { CATEGORY_SEED } from "@/lib/catalog/categories";

const COLUMNS = [
  { title: "الأقسام", links: CATEGORY_SEED.slice(0, 6).map((c) => ({ href: `/browse/${c.slug}`, label: c.nameAr })) },
  {
    title: "سواب",
    links: [
      { href: "/about", label: "عن سواب" },
      { href: "/how-it-works", label: "كيف يعمل" },
      { href: "/verification", label: "التوثيق والفحص" },
      { href: "/contact", label: "تواصل معنا" },
    ],
  },
  {
    title: "الأمان والسياسات",
    links: [
      { href: "/safety", label: "نصائح الأمان" },
      { href: "/verification#policy", label: "سياسة التوثيق" },
      { href: "/terms", label: "شروط الاستخدام" },
      { href: "/privacy", label: "سياسة الخصوصية" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface pb-24 md:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold">سواب</span>
            <span className="text-[10px] font-semibold tracking-[0.28em] text-subtle-foreground" dir="ltr">SWAP</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            سوق سعودي متخصص في أجهزة الكمبيوتر وقطعها المستعملة. بيع، بدّل، ووثّق حالة جهازك بتقرير فحص يرفع ثقة المشتري.
          </p>
          <p className="mt-4 text-[13px] font-semibold text-primary-ink">بيع. بدّل. وثّق.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-subtle-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} سواب. جميع الحقوق محفوظة.</p>
          <p>سواب منصة وسيطة تربط البائع بالمشتري، ولا تمتلك المنتجات المعروضة.</p>
        </div>
      </div>
    </footer>
  );
}
