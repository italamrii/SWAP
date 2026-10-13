"use client";

import { Bell, Heart, LayoutDashboard, MessageSquare, Package, Settings, ShieldCheck, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/account/listings", label: "إعلاناتي", icon: Package },
  { href: "/account/messages", label: "الرسائل", icon: MessageSquare, badge: "messages" as const },
  { href: "/account/offers", label: "العروض والبدل", icon: Tag, badge: "offers" as const },
  { href: "/account/favorites", label: "المفضلة", icon: Heart },
  { href: "/account/verification", label: "التوثيق والفحص", icon: ShieldCheck },
  { href: "/account/notifications", label: "التنبيهات", icon: Bell, badge: "notifications" as const },
  { href: "/account/settings", label: "الإعدادات", icon: Settings },
];

export function AccountNav({ counts }: { counts: { messages: number; offers: number; notifications: number } }) {
  const path = usePathname();
  return (
    <nav aria-label="قائمة الحساب" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {ITEMS.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        const n = it.badge ? counts[it.badge] : 0;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition lg:py-2.5",
              active ? "bg-surface text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <it.icon className={cn("size-[18px]", active && "text-primary")} aria-hidden />
            {it.label}
            {n > 0 && <span className="ms-auto rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground num">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
