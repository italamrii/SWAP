import { Bell, Heart, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { isStaff } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { PREVIEW_CATEGORIES, VISUAL_PREVIEW } from "@/lib/visual-preview";
import { cn } from "@/lib/utils";
import { getCategoryTree } from "@/server/queries/categories";
import { getUnreadCounts } from "@/server/queries/inbox";
import { CategoryBar, MobileCategoryChips, type NavCategory } from "./category-bar";
import { MobileTabBar } from "./mobile-nav";
import { NavDrawer } from "./nav-drawer";
import { PreviewBanner } from "./preview-banner";
import { SearchBox } from "./search-box";
import { UserMenu } from "./user-menu";

export async function SiteHeader({ showCategories = true }: { showCategories?: boolean }) {
  const [user, tree] = VISUAL_PREVIEW ? ([null, PREVIEW_CATEGORIES] as const) : await Promise.all([getCurrentUser(), getCategoryTree()]);
  const counts = user ? await getUnreadCounts(user.id) : { messages: 0, notifications: 0, offers: 0 };
  const categories: NavCategory[] = tree.map((c) => ({ slug: c.slug, nameAr: c.nameAr, icon: c.icon, children: c.children.map((s) => ({ slug: s.slug, nameAr: s.nameAr })) }));
  const drawerUser = user ? { displayName: user.displayName ?? "مستخدم", username: user.username ?? "", avatarUrl: user.avatarUrl, isStaff: isStaff(user) } : null;

  return (
    <>
      {VISUAL_PREVIEW && <PreviewBanner />}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85" data-testid="site-header">
        <div className="container-page flex h-14 items-center gap-2 md:h-16 md:gap-4">
          <Suspense fallback={<span className="-ms-2 size-10" aria-hidden />}><NavDrawer user={drawerUser} counts={counts} categories={categories} preview={VISUAL_PREVIEW} /></Suspense>
          <Logo className="shrink-0" />
          <div className="mx-2 hidden min-w-0 max-w-3xl flex-1 md:block">
            <Suspense fallback={<div className="h-11 rounded-lg border border-input bg-surface-2/70" />}><SearchBox size="header" withCity /></Suspense>
          </div>
          <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
            {user ? (
              <>
                <HeaderIcon href="/account/favorites" label="المفضلة" className="hidden lg:inline-flex"><Heart className="size-5" /></HeaderIcon>
                <HeaderIcon href="/account/messages" label="المحادثات" count={counts.messages + counts.offers}><MessageSquare className="size-5" /></HeaderIcon>
                <HeaderIcon href="/account/notifications" label="الإشعارات" count={counts.notifications}><Bell className="size-5" /></HeaderIcon>
                <div className="ms-1">
                  <UserMenu user={{ ...drawerUser!, email: user.email }} counts={counts} />
                </div>
              </>
            ) : VISUAL_PREVIEW ? (
              <span className="hidden rounded-md border border-dashed border-border-strong px-2.5 py-1 text-xs text-muted-foreground sm:inline">الحساب غير متاح في المعاينة</span>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/sign-in">تسجيل الدخول</Link></Button>
                <Button asChild variant="outline" size="sm" className="sm:hidden"><Link href="/sign-in">دخول</Link></Button>
              </>
            )}
            {!VISUAL_PREVIEW && (
              <Button asChild className="ms-1 hidden sm:inline-flex">
                <Link href="/account/listings/new"><Plus />أضف إعلان</Link>
              </Button>
            )}
          </div>
        </div>
        {showCategories && <Suspense fallback={<div className="hidden h-11 border-t border-border md:block" />}><CategoryBar categories={categories} /></Suspense>}
      </header>
      {/* Mobile: search + category chips scroll away; only the compact bar above is sticky. */}
      <div className="container-page border-b border-border bg-surface pt-2.5 md:hidden">
        <div className="pb-2.5"><Suspense fallback={<div className="h-11 rounded-lg border border-input bg-surface-2/70" />}><SearchBox size="header" withCity /></Suspense></div>
        {showCategories && <MobileCategoryChips categories={categories} />}
      </div>
      <MobileTabBar unread={counts.messages} signedIn={!!user} preview={VISUAL_PREVIEW} />
    </>
  );
}

function HeaderIcon({ href, label, count = 0, className, children }: { href: string; label: string; count?: number; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={count ? `${label} (${count} جديد)` : label}
      className={cn("relative inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition hover:bg-surface-2 hover:text-foreground", className)}
    >
      {children}
      {count > 0 && <span className="absolute top-1.5 end-1.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white num">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
