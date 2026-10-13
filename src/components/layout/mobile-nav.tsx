"use client";

import { Home, LayoutGrid, MessageSquare, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** App-like bottom tab bar on small screens. Hidden on listing pages (they have their own action bar). */
export function MobileTabBar({ unread = 0, signedIn }: { unread?: number; signedIn: boolean }) {
  const path = usePathname();
  if (path.startsWith("/listing/") || path.startsWith("/account/messages/") || path.startsWith("/account/listings/new") || path.includes("/edit")) return null;
  const tabs = [
    { href: "/", label: "الرئيسية", icon: Home, active: path === "/" },
    { href: "/browse", label: "تصفّح", icon: LayoutGrid, active: path.startsWith("/browse") },
    { href: "/account/listings/new", label: "أضف إعلان", icon: Plus, primary: true },
    { href: "/account/messages", label: "الرسائل", icon: MessageSquare, active: path.startsWith("/account/messages"), badge: unread },
    { href: signedIn ? "/account" : "/sign-in", label: signedIn ? "حسابي" : "دخول", icon: User, active: path === "/account" || path.startsWith("/account/settings") },
  ];
  return (
    <nav aria-label="التنقل الرئيسي" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden pb-safe">
      <ul className="grid grid-cols-5 pt-1.5">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className={cn("relative flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-medium", t.active ? "text-primary-ink" : "text-muted-foreground")}>
              {t.primary ? (
                <span className="-mt-4 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                  <t.icon className="size-5" />
                </span>
              ) : (
                <t.icon className="size-[22px]" strokeWidth={t.active ? 2.2 : 1.8} />
              )}
              <span>{t.label}</span>
              {!!t.badge && <span className="absolute top-0 start-1/2 ms-2 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{t.badge}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
