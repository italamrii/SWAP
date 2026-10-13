import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Compact marketplace section header: title, optional context, "view all". */
export function MarketSection({ id, title, icon, note, href, linkLabel = "عرض الكل", tone, className, children }: { id: string; title: string; icon?: React.ReactNode; note?: string; href?: string; linkLabel?: string; tone?: "swap" | "verified"; className?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className={cn("container-page pt-7 sm:pt-9", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-h`} className={cn("flex items-center gap-2 text-[17px] font-bold sm:text-lg", tone === "swap" && "text-swap-ink", tone === "verified" && "text-primary-ink")}>
            {icon}
            <span className={cn(tone && "text-foreground")}>{title}</span>
          </h2>
          {note && <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{note}</p>}
        </div>
        {href && (
          <Link href={href} className="group inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-primary-ink hover:underline underline-offset-4">
            {linkLabel}
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
