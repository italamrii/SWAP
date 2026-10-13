"use client";

import { ArrowLeftRight, BadgeCheck, ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_BAR } from "@/lib/nav";
import { cn } from "@/lib/utils";

export interface NavCategory {
  slug: string;
  nameAr: string;
  icon: string;
  children: { slug: string; nameAr: string }[];
}

/** Desktop category navigation under the main header. */
export function CategoryBar({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const items = CATEGORY_BAR.filter((c) => bySlug.has(c.slug));
  const activeSlug = pathname.startsWith("/browse/") ? pathname.split("/")[2] : null;

  return (
    <nav aria-label="الأقسام" className="hidden border-t border-border md:block">
      <div className="container-page flex h-11 items-center gap-1">
        <AllCategoriesMenu categories={categories} />
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ul className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
          {items.map((c) => {
            const active = activeSlug === c.slug;
            return (
              <li key={c.slug} className="shrink-0">
                <Link
                  href={`/browse/${c.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-11 items-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors",
                    active ? "text-primary-ink" : "text-muted-foreground hover:text-foreground",
                    "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full",
                    active ? "after:bg-primary" : "hover:after:bg-border-strong",
                  )}
                >
                  <CategoryIcon icon={bySlug.get(c.slug)!.icon} className="size-4" />
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden shrink-0 items-center gap-1 lg:flex">
          <QuickLink href="/browse?swap=1" active={pathname === "/browse" && params.get("swap") === "1"} icon={<ArrowLeftRight className="size-4" />} tone="swap">البدل</QuickLink>
          <QuickLink href="/browse?verified=1" active={pathname === "/browse" && params.get("verified") === "1"} icon={<BadgeCheck className="size-4" />}>الموثّقة</QuickLink>
        </div>
      </div>
    </nav>
  );
}

function QuickLink({ href, active, icon, tone, children }: { href: string; active: boolean; icon: React.ReactNode; tone?: "swap"; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition",
        tone === "swap" ? "text-swap-ink hover:bg-swap-soft" : "text-primary-ink hover:bg-primary-soft",
        active && (tone === "swap" ? "bg-swap-soft" : "bg-primary-soft"),
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function AllCategoriesMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-graphite px-3 text-[13px] font-semibold text-background transition hover:opacity-90" aria-label="كل الأقسام">
        <LayoutGrid className="size-4" aria-hidden />
        كل الأقسام
        <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(94vw,56rem)] p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.slug}>
              <Link href={`/browse/${c.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm font-semibold hover:text-primary-ink">
                <span className="flex size-7 items-center justify-center rounded-md bg-surface-2"><CategoryIcon icon={c.icon} className="size-4" /></span>
                {c.nameAr}
              </Link>
              {c.children.length > 0 && (
                <ul className="mt-1.5 space-y-1 ps-9">
                  {c.children.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/browse/${c.slug}?sub=${s.slug}`} onClick={() => setOpen(false)} className="text-[13px] text-muted-foreground hover:text-foreground">
                        {s.nameAr}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[13px]">
          <Link href="/browse" onClick={() => setOpen(false)} className="font-semibold text-primary-ink hover:underline">تصفّح كل الإعلانات</Link>
          <span className="text-muted-foreground">{categories.length} قسم متخصص</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Mobile: horizontally scrollable category chips (home and browse only). */
export function MobileCategoryChips({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  // Home renders its own category row with counts.
  if (!pathname.startsWith("/browse")) return null;
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const activeSlug = pathname.startsWith("/browse/") ? pathname.split("/")[2] : null;
  return (
    <nav aria-label="الأقسام" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2.5 scrollbar-none md:hidden">
      {CATEGORY_BAR.filter((c) => bySlug.has(c.slug)).map((c) => (
        <Link
          key={c.slug}
          href={`/browse/${c.slug}`}
          aria-current={activeSlug === c.slug ? "page" : undefined}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium",
            activeSlug === c.slug ? "border-primary bg-primary-soft text-primary-ink" : "border-border bg-surface text-foreground",
          )}
        >
          <CategoryIcon icon={bySlug.get(c.slug)!.icon} className="size-3.5" />
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
