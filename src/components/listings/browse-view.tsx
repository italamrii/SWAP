import { SearchX } from "lucide-react";
import Link from "next/link";
import { SearchBox } from "@/components/layout/search-box";
import { CategoryIcon } from "@/components/shared/category-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { activeFilterCount, parseBrowseParams, toSearchParams, type BrowseFilters } from "@/lib/browse-params";
import { cityLabel } from "@/lib/catalog/cities";
import { conditionLabel } from "@/lib/catalog/conditions";
import { TRISTATE_LABELS, filterableFields, formatSpecValue } from "@/lib/catalog/helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { listingsCount } from "@/lib/format";
import type { CategoryNode } from "@/server/queries/categories";
import { getAttributeFacets, getFavoriteIdSet, searchListings } from "@/server/queries/listings";
import { ActiveFilterChips, SortSelect, type ActiveChip } from "./browse-toolbar";
import { FilterPanel, MobileFilterButton } from "./filter-panel";
import { ListingCard, ListingGrid } from "./listing-card";

type Params = Record<string, string | string[] | undefined>;

export async function BrowseView({ params, category, allCategories, basePath }: { params: Params; category: CategoryNode | null; allCategories: CategoryNode[]; basePath: string }) {
  const filters = parseBrowseParams(params, category?.schemaKey);
  const sub = category?.children.find((c) => c.slug === filters.sub);
  const [user, result, facets] = await Promise.all([
    getCurrentUser(),
    searchListings({ ...filters, categoryId: category?.id, subcategoryId: sub?.id }),
    category ? getAttributeFacets(category.id) : Promise.resolve({}),
  ]);
  const saved = await getFavoriteIdSet(user?.id, result.items.map((i) => i.id));
  const fields = category ? filterableFields(category.schemaKey) : [];
  const chips = buildChips(filters, category);
  const active = activeFilterCount(filters);
  const panelProps = { fields, facets, subcategories: category?.children.map((c) => ({ slug: c.slug, nameAr: c.nameAr })) ?? [], total: result.total, activeCount: active };

  const title = filters.q ? <>نتائج البحث عن «<bdi>{filters.q}</bdi>»</> : sub?.nameAr ?? category?.nameAr ?? "كل الإعلانات";

  return (
    <div className="container-page pt-6 sm:pt-8">
      <nav aria-label="مسار التنقل" className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">الرئيسية</Link>
        <span aria-hidden>/</span>
        <Link href="/browse" className="hover:text-foreground">تصفّح</Link>
        {category && (<><span aria-hidden>/</span><span className="text-foreground">{category.nameAr}</span></>)}
      </nav>

      <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          {category && (
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface shadow-xs sm:flex">
              <CategoryIcon icon={category.icon} className="size-7" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {category?.descriptionAr && !filters.q ? `${category.descriptionAr} · ` : ""}
              <span className="font-medium text-foreground">{listingsCount(result.total)}</span>
            </p>
          </div>
        </div>
        <div className="w-full md:max-w-sm">
          <SearchBox defaultValue={filters.q} autoFocus={params.focus === "search"} />
        </div>
      </div>

      {!category && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {allCategories.map((c) => {
            const sp = toSearchParams({ ...filters, attrs: {}, ranges: {}, sub: undefined, page: 1 });
            return (
              <Link key={c.slug} href={`/browse/${c.slug}${sp.size ? `?${sp}` : ""}`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[13px] font-medium transition hover:border-border-strong">
                <CategoryIcon icon={c.icon} className="size-3.5 text-muted-foreground" />
                {c.nameAr}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex gap-8">
        <FilterPanel {...panelProps} />
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MobileFilterButton {...panelProps} />
              <p className="hidden text-sm text-muted-foreground sm:block">{result.total > 0 ? `عرض ${(filters.page - 1) * 24 + 1}–${Math.min(filters.page * 24, result.total)} من ${result.total}` : ""}</p>
            </div>
            <SortSelect />
          </div>
          {chips.length > 0 && <div className="mb-5"><ActiveFilterChips chips={chips} /></div>}

          {result.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="ما لقينا إعلانات تطابق بحثك"
              description="جرّب تخفف الفلاتر أو توسّع نطاق السعر. وإذا كنت تدوّر على قطعة معيّنة، احفظ البحث وارجع لاحقًا — الإعلانات تنزل يوميًا."
              action={
                <>
                  {active > 0 && <Button asChild variant="outline"><Link href={basePath + (filters.q ? `?q=${encodeURIComponent(filters.q)}` : "")}>مسح الفلاتر</Link></Button>}
                  <Button asChild><Link href="/browse">تصفّح كل الإعلانات</Link></Button>
                </>
              }
            />
          ) : (
            <ListingGrid className="md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {result.items.map((l, i) => <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} priority={i < 3} />)}
            </ListingGrid>
          )}

          <Pagination
            page={filters.page}
            pages={result.pages}
            hrefFor={(p) => {
              const sp = toSearchParams({ ...filters, page: p });
              return `${basePath}${sp.size ? `?${sp}` : ""}`;
            }}
          />
        </div>
      </div>
    </div>
  );
}

function buildChips(f: BrowseFilters, category: CategoryNode | null): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.sub) chips.push({ key: "sub", label: category?.children.find((c) => c.slug === f.sub)?.nameAr ?? f.sub, remove: { sub: null } });
  if (f.verified) chips.push({ key: "verified", label: "موثّق", remove: { verified: null } });
  if (f.swap) chips.push({ key: "swap", label: "يقبل البدل", remove: { swap: null } });
  if (f.negotiable) chips.push({ key: "neg", label: "قابل للتفاوض", remove: { negotiable: null } });
  if (f.city) chips.push({ key: "city", label: cityLabel(f.city), remove: { city: null } });
  if (f.min !== undefined || f.max !== undefined)
    chips.push({ key: "price", label: `${f.min ?? 0} – ${f.max ?? "∞"} ر.س`, remove: { min: null, max: null } });
  for (const c of f.conditions) {
    const rest = f.conditions.filter((x) => x !== c).join(",");
    chips.push({ key: `cond-${c}`, label: conditionLabel(c), remove: { condition: rest || null } });
  }
  const fields = category ? filterableFields(category.schemaKey) : [];
  for (const [key, values] of Object.entries(f.attrs)) {
    const field = fields.find((x) => x.key === key);
    for (const v of values) {
      const rest = values.filter((x) => x !== v).join(",");
      const label = field?.type === "tristate" ? `${field.label}: ${TRISTATE_LABELS[v]}` : field?.type === "boolean" ? field.label : field ? (formatSpecValue(field, v) ?? v) : v;
      chips.push({ key: `${key}-${v}`, label, remove: { [`f.${key}`]: rest || null } });
    }
  }
  for (const [key, r] of Object.entries(f.ranges)) {
    const field = fields.find((x) => x.key === key);
    chips.push({ key: `r-${key}`, label: `${field?.label ?? key}: ${r.min ?? ""}–${r.max ?? ""}${field?.unit ?? ""}`, remove: { [`f.${key}.min`]: null, [`f.${key}.max`]: null } });
  }
  return chips;
}
