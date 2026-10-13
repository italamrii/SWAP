import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { CATEGORY_BAR, DRAWER_GROUPS } from "@/lib/nav";

const trust = DRAWER_GROUPS.find((g) => g.id === "trust")!.items;
const platform = DRAWER_GROUPS.find((g) => g.id === "platform")!.items;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface pb-24 md:pb-0">
      <div className="container-page grid grid-cols-2 gap-8 py-10 md:grid-cols-[1.3fr_2fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-base font-bold">سواب</span>
            <span className="text-[10px] font-semibold tracking-[0.25em] text-subtle-foreground" dir="ltr">SWAP</span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">سوق سعودي متخصص في الكمبيوتر وقطعه المستعملة. بيع، بدّل، ووثّق حالة جهازك بتقرير فحص.</p>
        </div>
        <FooterCol title="الأقسام" className="col-span-2 md:col-span-1">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {CATEGORY_BAR.map((c) => <li key={c.slug}><Link href={`/browse/${c.slug}`} className="text-[13px] text-muted-foreground hover:text-foreground">{c.label}</Link></li>)}
          </ul>
        </FooterCol>
        <FooterCol title="الثقة والدعم">
          <ul className="space-y-2">{trust.map((l) => <li key={l.href}><Link href={l.href} className="text-[13px] text-muted-foreground hover:text-foreground">{l.label}</Link></li>)}</ul>
        </FooterCol>
        <FooterCol title="المنصة">
          <ul className="space-y-2">{platform.map((l) => <li key={l.href}><Link href={l.href} className="text-[13px] text-muted-foreground hover:text-foreground">{l.label}</Link></li>)}</ul>
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-1.5 py-4 text-[11.5px] text-subtle-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} سواب · بيع. بدّل. وثّق.</p>
          <p>سواب منصة وسيطة تربط البائع بالمشتري، ولا تمتلك المنتجات المعروضة.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h2 className="mb-3 text-[13px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}
