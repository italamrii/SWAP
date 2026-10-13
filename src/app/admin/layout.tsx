import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { requireStaff } from "@/lib/auth/guards";
import { getAdminOverview } from "@/server/queries/admin";

export const metadata: Metadata = { title: { default: "الإدارة", template: "%s | إدارة سواب" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const { counts } = await getAdminOverview();
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="bg-graphite text-white lg:sticky lg:top-0 lg:h-dvh dark:bg-[#0a0c0e]">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="leading-tight"><span className="block font-bold">سواب</span><span className="block text-[11px] text-white/50">لوحة الإشراف</span></span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-xs text-white/60 hover:text-white lg:hidden"><ArrowRight className="size-3.5" />الموقع</Link>
        </div>
        <div className="px-4 pb-3 lg:px-3">
          <AdminNav counts={{ pending: counts.pending, inspections: counts.pendingInspections, reports: counts.openReports }} isAdmin={staff.role === "admin"} />
        </div>
        <div className="mt-auto hidden border-t border-white/10 p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <div className="flex items-center gap-2.5">
            <Avatar name={staff.displayName ?? "?"} size={32} />
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold">{staff.displayName}</p>
              <p className="text-white/50">{staff.role === "admin" ? "مدير" : "مشرف"}</p>
            </div>
            <Link href="/" className="ms-auto text-xs text-white/60 hover:text-white">الموقع ←</Link>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex h-14 items-center justify-end gap-2 border-b border-border px-4 lg:px-8"><ThemeToggle /></div>
        <main id="main" className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
