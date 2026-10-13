"use client";

import { ChevronDown, Menu, Plus } from "lucide-react";
import { Dialog as D } from "radix-ui";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DRAWER_GROUPS, activeNavHref } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { NavCategory } from "./category-bar";
import { NavIconGlyph } from "./nav-icons";
import { ThemeToggle } from "./theme-toggle";

export interface DrawerUser {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isStaff: boolean;
}

const ALL_HREFS = DRAWER_GROUPS.flatMap((g) => g.items.map((i) => i.href));

/**
 * Full navigation hub. Radix Dialog provides the focus trap, Escape to close,
 * scroll lock, and focus return to the trigger.
 */
export function NavDrawer({
  user,
  counts,
  categories,
  preview,
}: {
  user: DrawerUser | null;
  counts: { messages: number; offers: number; notifications: number };
  categories: NavCategory[];
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const active = activeNavHref(ALL_HREFS, pathname, params);
  const activeCategory = pathname.startsWith("/browse/") ? pathname.split("/")[2] : null;
  const close = () => setOpen(false);

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="القائمة الرئيسية" data-testid="drawer-trigger" className="-ms-2">
          <Menu className="size-5" />
        </Button>
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <D.Content
          data-testid="nav-drawer"
          className="fixed inset-y-0 start-0 z-50 flex w-[86%] max-w-[22rem] flex-col border-e border-border bg-surface shadow-pop outline-none data-[state=open]:animate-in data-[state=open]:duration-250 data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:slide-out-to-right ltr:data-[state=open]:slide-in-from-left ltr:data-[state=closed]:slide-out-to-left"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Link href="/" onClick={close} className="flex items-center gap-2">
              <LogoMark size={28} />
              <span className="leading-none">
                <span className="block text-[17px] font-bold">سواب</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">بيع. بدّل. وثّق.</span>
              </span>
            </Link>
            <D.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="إغلاق القائمة">
                <span aria-hidden className="text-lg leading-none">×</span>
              </Button>
            </D.Close>
          </div>
          <D.Title className="sr-only">القائمة الرئيسية</D.Title>
          <D.Description className="sr-only">روابط السوق والحساب والدعم</D.Description>

          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            {/* Identity */}
            {user ? (
              <Link href={`/seller/${user.username}`} onClick={close} className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3 transition hover:bg-border/60">
                <Avatar name={user.displayName} src={user.avatarUrl} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{user.displayName}</span>
                  <span className="block truncate text-xs text-muted-foreground" dir="ltr">@{user.username}</span>
                </span>
              </Link>
            ) : preview ? (
              <p className="mb-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
                معاينة تصميم: تسجيل الدخول والحساب والمحادثات غير متاحة في هذه النسخة.
              </p>
            ) : (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm"><Link href="/sign-in" onClick={close}>تسجيل الدخول</Link></Button>
                <Button asChild size="sm"><Link href="/sign-up" onClick={close}>إنشاء حساب</Link></Button>
              </div>
            )}
            {!preview && (
              <Button asChild className="mb-4 w-full"><Link href="/account/listings/new" onClick={close}><Plus />أضف إعلان</Link></Button>
            )}

            {DRAWER_GROUPS.map((group) => {
              const items = preview && group.id === "account" ? [] : group.items;
              return (
                <section key={group.id} aria-labelledby={`nav-${group.id}`} className="mb-4">
                  <h2 id={`nav-${group.id}`} className="mb-1 px-3 text-[11px] font-semibold tracking-wide text-subtle-foreground">{group.title}</h2>
                  <ul>
                    {items.map((item) => {
                      const isActive = active === item.href;
                      const n = item.badge ? counts[item.badge] : 0;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                              isActive ? "bg-primary-soft text-primary-ink" : "text-foreground hover:bg-surface-2",
                            )}
                          >
                            {isActive && <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary" aria-hidden />}
                            <NavIconGlyph icon={item.icon} className={cn("size-[18px]", isActive ? "text-primary" : "text-muted-foreground")} />
                            {item.label}
                            {n > 0 && <span className="ms-auto rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground num">{n > 99 ? "99+" : n}</span>}
                          </Link>
                        </li>
                      );
                    })}
                    {group.id === "market" && <CategoryTree categories={categories} activeSlug={activeCategory} onNavigate={close} />}
                    {group.id === "account" && user?.isStaff && (
                      <li>
                        <Link href="/admin" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-2">
                          <NavIconGlyph icon="shield" className="size-[18px] text-muted-foreground" />
                          لوحة الإدارة
                        </Link>
                      </li>
                    )}
                    {group.id === "account" && preview && <li className="px-3 py-1.5 text-xs text-muted-foreground">غير متاح في المعاينة</li>}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground pb-safe">
            <span>الوضع الليلي</span>
            <ThemeToggle />
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

function CategoryTree({ categories, activeSlug, onNavigate }: { categories: NavCategory[]; activeSlug: string | null; onNavigate: () => void }) {
  const [open, setOpen] = useState(Boolean(activeSlug));
  const [expanded, setExpanded] = useState<string | null>(activeSlug);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="drawer-categories"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-2"
      >
        <NavIconGlyph icon="folders" className="size-[18px] text-muted-foreground" />
        الأقسام
        <ChevronDown className={cn("ms-auto size-4 text-subtle-foreground transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul id="drawer-categories" className="ms-5 border-s border-border ps-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <div className="flex items-center">
                <Link
                  href={`/browse/${c.slug}`}
                  onClick={onNavigate}
                  aria-current={activeSlug === c.slug ? "page" : undefined}
                  className={cn("flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-[13.5px]", activeSlug === c.slug ? "font-semibold text-primary-ink" : "hover:bg-surface-2")}
                >
                  <CategoryIcon icon={c.icon} className="size-4 text-muted-foreground" />
                  {c.nameAr}
                </Link>
                {c.children.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => (e === c.slug ? null : c.slug))}
                    aria-expanded={expanded === c.slug}
                    aria-label={`الأقسام الفرعية: ${c.nameAr}`}
                    className="rounded-md p-1.5 text-subtle-foreground hover:bg-surface-2"
                  >
                    <ChevronDown className={cn("size-3.5 transition", expanded === c.slug && "rotate-180")} />
                  </button>
                )}
              </div>
              {expanded === c.slug && c.children.length > 0 && (
                <ul className="mb-1 ms-6 space-y-0.5">
                  {c.children.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/browse/${c.slug}?sub=${s.slug}`} onClick={onNavigate} className="block rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                        {s.nameAr}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
