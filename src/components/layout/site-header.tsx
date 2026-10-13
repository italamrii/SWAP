import { Bell, Plus, Search } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Button } from "@/components/ui/button";
import { isStaff } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategoryTree } from "@/server/queries/categories";
import { getUnreadCounts } from "@/server/queries/inbox";
import { MobileTabBar } from "./mobile-nav";
import { SearchBox } from "./search-box";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function SiteHeader({ showCategories = true }: { showCategories?: boolean }) {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategoryTree()]);
  const counts = user ? await getUnreadCounts(user.id) : { messages: 0, notifications: 0, offers: 0 };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <div className="container-page flex h-16 items-center gap-4">
          <Logo />
          <nav aria-label="روابط رئيسية" className="ms-2 hidden items-center gap-1 lg:flex">
            <HeaderLink href="/browse">تصفّح</HeaderLink>
            <HeaderLink href="/browse?swap=1">البدل</HeaderLink>
            <HeaderLink href="/verification">التوثيق والفحص</HeaderLink>
            <HeaderLink href="/how-it-works">كيف يعمل سواب</HeaderLink>
          </nav>
          <div className="mx-auto hidden w-full max-w-md md:block">
            <SearchBox />
          </div>
          <div className="ms-auto flex items-center gap-1.5 md:ms-0">
            <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="بحث">
              <Link href="/browse?focus=search"><Search className="size-5" /></Link>
            </Button>
            <ThemeToggle />
            {user ? (
              <>
                <Button asChild variant="ghost" size="icon" className="relative hidden sm:inline-flex" aria-label={`التنبيهات${counts.notifications ? ` (${counts.notifications} جديدة)` : ""}`}>
                  <Link href="/account/notifications">
                    <Bell className="size-[18px]" />
                    {counts.notifications > 0 && (
                      <span className="absolute top-1.5 end-1.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{counts.notifications}</span>
                    )}
                  </Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/account/listings/new"><Plus />أضف إعلان</Link>
                </Button>
                <UserMenu
                  user={{ displayName: user.displayName ?? "مستخدم", username: user.username ?? "", avatarUrl: user.avatarUrl, email: user.email, isStaff: isStaff(user) }}
                  counts={counts}
                />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/sign-in">تسجيل الدخول</Link></Button>
                <Button asChild><Link href="/sign-up">إنشاء حساب</Link></Button>
              </>
            )}
          </div>
        </div>
        {showCategories && (
          <div className="hidden border-t border-border/70 lg:block">
            <nav aria-label="الأقسام" className="container-page flex h-11 items-center gap-1 overflow-x-auto scrollbar-none">
              {categories.map((c) => (
                <Link key={c.slug} href={`/browse/${c.slug}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
                  <CategoryIcon icon={c.icon} className="size-3.5" />
                  {c.nameAr}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      <MobileTabBar unread={counts.messages} signedIn={!!user} />
    </>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
      {children}
    </Link>
  );
}
