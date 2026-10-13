import type { Metadata } from "next";
import Link from "next/link";
import { UserModeration } from "@/components/admin/controls";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { requireStaff } from "@/lib/auth/guards";
import { cityLabel } from "@/lib/catalog/cities";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAdminUsers } from "@/server/queries/admin";

export const metadata: Metadata = { title: "المستخدمون" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const staff = await requireStaff();
  const { q, filter = "all" } = await searchParams;
  const rows = await getAdminUsers(q?.slice(0, 60), filter);
  return (
    <div className="space-y-6">
      <PageHeader title="المستخدمون" description="ابحث، وثّق البائعين، وتعامل مع الحسابات المخالفة." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {[["all", "الكل"], ["suspended", "موقوف/محظور"], ["staff", "الفريق"]].map(([k, l]) => (
            <Link key={k} href={`/admin/users?filter=${k}`} className={cn("inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium", filter === k ? "bg-graphite text-background" : "bg-surface-2 text-muted-foreground")}>{l}</Link>
          ))}
        </div>
        <form className="w-full sm:w-72"><input type="hidden" name="filter" value={filter} /><Input name="q" defaultValue={q} placeholder="بريد، اسم مستخدم، أو اسم" aria-label="بحث" /></form>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-surface-2/60 text-xs text-muted-foreground">
            <tr><th className="p-3 text-start font-medium">المستخدم</th><th className="p-3 text-start font-medium">الحالة</th><th className="p-3 text-start font-medium">الإعلانات</th><th className="p-3 text-start font-medium">انضم</th><th className="p-3 text-start font-medium">آخر نشاط</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.displayName} size={34} />
                    <div className="min-w-0">
                      <Link href={`/seller/${u.username}`} className="font-semibold hover:underline">{u.displayName}</Link>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge size="sm" variant={u.status === "active" ? "verified" : u.status === "suspended" ? "warning" : "danger"}>{u.status === "active" ? "نشط" : u.status === "suspended" ? "موقوف" : "محظور"}</Badge>
                    {u.role !== "user" && <Badge size="sm" variant="dark">{u.role === "admin" ? "مدير" : "مشرف"}</Badge>}
                    {u.trusted && <Badge size="sm" variant="info">موثوق</Badge>}
                    {u.reports > 0 && <Badge size="sm" variant="danger">{u.reports} بلاغ</Badge>}
                  </div>
                </td>
                <td className="p-3 num">{u.listings}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}<br />{u.city ? cityLabel(u.city) : ""}</td>
                <td className="p-3 text-xs text-muted-foreground">{u.lastSeenAt ? timeAgo(u.lastSeenAt) : "—"}</td>
                <td className="p-3 text-end"><UserModeration userId={u.id} status={u.status} trusted={u.trusted} role={u.role} viewerIsAdmin={staff.role === "admin"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
