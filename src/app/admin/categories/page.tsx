import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddSubcategory, CategoryControls } from "@/components/admin/controls";
import { CategoryIcon } from "@/components/shared/category-icon";
import { PageHeader } from "@/components/shared/page-header";
import { requireStaff } from "@/lib/auth/guards";
import { filterableFields } from "@/lib/catalog/helpers";
import { getSpecSchema } from "@/lib/catalog/specs";
import { getCategoryCounts, getCategoryTree } from "@/server/queries/categories";

export const metadata: Metadata = { title: "الأقسام" };

export default async function AdminCategories() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  const [tree, counts] = await Promise.all([getCategoryTree({ includeInactive: true }), getCategoryCounts()]);
  return (
    <div className="space-y-6">
      <PageHeader title="الأقسام" description="رتّب الأقسام وأخفِها أو ميّزها. حقول المواصفات معرّفة في الكود (lib/catalog/specs.ts) لضمان اتساق الفلاتر." />
      <ul className="space-y-3">
        {tree.map((c, i) => (
          <li key={c.id} className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2"><CategoryIcon icon={c.icon} className="size-5" /></span>
                <div>
                  <p className="text-sm font-semibold">{c.nameAr} <span className="font-normal text-muted-foreground" dir="ltr">/{c.slug}</span></p>
                  <p className="text-xs text-muted-foreground">{counts.get(c.id) ?? 0} إعلان نشط · مخطط «{c.schemaKey}» · {getSpecSchema(c.schemaKey)?.fields.length ?? 0} حقل ({filterableFields(c.schemaKey).length} قابل للفلترة)</p>
                </div>
              </div>
              <CategoryControls id={c.id} isActive={c.isActive} featured={c.featured} nameAr={c.nameAr} isRoot first={i === 0} last={i === tree.length - 1} />
            </div>
            <div className="mt-3 space-y-2 border-t border-border pt-3 ps-4 lg:ps-13">
              {c.children.map((s, j) => (
                <div key={s.id} className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <span className="text-[13px]">↳ {s.nameAr} <span className="text-muted-foreground" dir="ltr">/{s.slug}</span></span>
                  <CategoryControls id={s.id} isActive={s.isActive} featured={false} nameAr={s.nameAr} isRoot={false} first={j === 0} last={j === c.children.length - 1} />
                </div>
              ))}
              <AddSubcategory parentId={c.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
