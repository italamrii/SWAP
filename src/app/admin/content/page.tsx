import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BannerEditor } from "@/components/admin/controls";
import { PageHeader } from "@/components/shared/page-header";
import { requireStaff } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";

export const metadata: Metadata = { title: "المحتوى" };

export default async function AdminContent() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder), asc(banners.createdAt));
  return (
    <div className="space-y-6">
      <PageHeader title="المحتوى والإعلانات الترويجية" description="الشريط الترويجي أعلى الصفحة الرئيسية. يظهر أول شريط مفعّل فقط." />
      <div className="space-y-3">
        {rows.map((b) => <BannerEditor key={b.id} banner={b} />)}
        <h2 className="pt-4 text-sm font-semibold text-muted-foreground">إضافة شريط جديد</h2>
        <BannerEditor />
      </div>
    </div>
  );
}
