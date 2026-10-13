import { cn } from "@/lib/utils";

export function ContentPage({ eyebrow, title, intro, updated, toc, children, className }: { eyebrow?: string; title: string; intro?: string; updated?: string; toc?: { id: string; label: string }[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("container-page pt-10 sm:pt-14", className)}>
      <header className="max-w-3xl">
        {eyebrow && <p className="mb-3 text-sm font-semibold text-primary-ink">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground text-pretty">{intro}</p>}
        {updated && <p className="mt-3 text-xs text-subtle-foreground">آخر تحديث: {updated}</p>}
      </header>
      <div className={cn("mt-10 gap-12", toc && "lg:grid lg:grid-cols-[220px_minmax(0,1fr)]")}>
        {toc && (
          <nav aria-label="محتويات الصفحة" className="hidden lg:block">
            <ul className="sticky top-32 space-y-1 border-s border-border text-[13px]">
              {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="-ms-px block border-s border-transparent py-1 ps-4 text-muted-foreground hover:border-primary hover:text-foreground">{t.label}</a></li>)}
            </ul>
          </nav>
        )}
        <div className="max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
