import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/shared/category-icon";
import { SectionHeading } from "@/components/shared/section-heading";
import type { CategoryNode } from "@/server/queries/categories";

export function CategoryGrid({ categories, counts }: { categories: CategoryNode[]; counts: Map<number, number> }) {
  const featured = categories.filter((c) => c.featured).slice(0, 8);
  return (
    <section className="container-page pt-16 sm:pt-20">
      <SectionHeading title="تسوّق حسب القسم" description="كل قسم له مواصفاته وفلاتره الخاصة — من VRAM الكرت إلى صحة بطارية اللابتوب." href="/browse" linkLabel="كل الأقسام" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {featured.map((c) => {
          const n = counts.get(c.id) ?? 0;
          return (
            <Link
              key={c.slug}
              href={`/browse/${c.slug}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card sm:min-h-36 sm:p-5"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-foreground transition group-hover:bg-primary-soft group-hover:text-primary-ink">
                <CategoryIcon icon={c.icon} className="size-[22px]" />
              </span>
              <span className="mt-5 block">
                <span className="block text-[15px] font-semibold">{c.nameAr}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{n > 0 ? `${n} إعلان نشط` : "كن أول من يعرض"}</span>
              </span>
              <ArrowLeft className="absolute top-5 end-5 size-4 text-subtle-foreground opacity-0 transition group-hover:-translate-x-0.5 group-hover:opacity-100" aria-hidden />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
