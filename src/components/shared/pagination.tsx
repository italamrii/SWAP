import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page, page - 1, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...nums].sort((a, b) => a - b);
  return (
    <nav aria-label="الصفحات" className="mt-12 flex items-center justify-center gap-1">
      <PageLink href={page > 1 ? hrefFor(page - 1) : undefined} label="السابق"><ChevronRight className="size-4" /></PageLink>
      {sorted.map((n, i) => (
        <span key={n} className="flex items-center gap-1">
          {i > 0 && n - sorted[i - 1] > 1 && <span className="px-1 text-subtle-foreground">…</span>}
          <Link
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn("flex size-10 items-center justify-center rounded-md text-sm font-semibold num", n === page ? "bg-graphite text-background" : "hover:bg-surface-2")}
          >
            {n}
          </Link>
        </span>
      ))}
      <PageLink href={page < pages ? hrefFor(page + 1) : undefined} label="التالي"><ChevronLeft className="size-4" /></PageLink>
    </nav>
  );
}

function PageLink({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  if (!href) return <span aria-disabled className="flex size-10 items-center justify-center rounded-md text-subtle-foreground/50">{children}</span>;
  return <Link href={href} aria-label={label} className="flex size-10 items-center justify-center rounded-md hover:bg-surface-2">{children}</Link>;
}
