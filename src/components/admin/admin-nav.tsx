"use client";

import { BarChart3, FolderTree, Flag, Gauge, Megaphone, Package, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "لوحة التحكم", icon: Gauge, exact: true },
  { href: "/admin/listings", label: "الإعلانات", icon: Package, badge: "pending" as const },
  { href: "/admin/inspections", label: "تقارير الفحص", icon: ShieldCheck, badge: "inspections" as const },
  { href: "/admin/reports", label: "البلاغات", icon: Flag, badge: "reports" as const },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/categories", label: "الأقسام", icon: FolderTree, adminOnly: true },
  { href: "/admin/content", label: "المحتوى", icon: Megaphone, adminOnly: true },
  { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
];

export function AdminNav({ counts, isAdmin }: { counts: { pending: number; inspections: number; reports: number }; isAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="قائمة الإدارة" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none lg:mx-0 lg:flex-col lg:px-0">
      {ITEMS.filter((i) => !i.adminOnly || isAdmin).map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        const n = it.badge ? counts[it.badge] : 0;
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition lg:py-2.5", active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}>
            <it.icon className="size-[18px]" aria-hidden />
            {it.label}
            {n > 0 && <span className="ms-auto rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-black num">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
