import { LayoutGrid, SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryIcon } from "@/components/shared/category-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { activeFilterCount, parseBrowseParams, toSearchParams, type BrowseFilters } from "@/lib/browse-params";
import { cityLabel } from "@/lib/catalog/cities";
import { conditionLabel } from "@/lib/catalog/conditions";
import { TRISTATE_LABELS, filterableFields, formatSpecValue } from "@/lib/catalog/helpers";
import { listingsCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/server/queries/categories";
import { getAttributeFacets, getFavoriteIdSet, searchListings } from "@/server/queries/listings";
import type { ListingCardData } from "@/server/types";
import { ActiveFilterChips, SortSelect, ViewToggle, type ActiveChip } from "./browse-toolbar";
import { FilterPanel, MobileFilterButton } from "./filter-panel";
import { ListingCard, ListingGrid, type CardVariant } from "./listing-card";

type Params = Record<string, string | string[] | undefined>;

/** Database-backed browse page. */
export async function BrowseView({ params, category, allCategories, categoryCounts, basePath }: { params: Params; category: CategoryNode | null; allCategories: CategoryNode[]; categoryCounts: Map<number, number>; basePath: string }) {
  const filters = parseBrowseParams(params, category?.schemaKey);
  const sub = category?.children.find((c) => c.slug === filters.sub);
  const [user, result, facets] = await Promise.all([
    getCurrentUser(),
    searchListings({ ...filters, categoryId: category?.id, subcategoryId: sub?.id }),
    category ? getAttributeFacets(category.id) : Promise.resolve({}),
  ]);
  const saved = await getFavoriteIdSet(user?.id, result.items.map((i) => i.id));
  return <BrowseLayout params={params} filters={filters} category={category} allCategories={allCategories} categoryCounts={categoryCounts} result={result} facets={facets} saved={saved} basePath={basePath} />;
}

export interface BrowseLayoutProps {
  params: Params;
  filters: BrowseFilters;
  category: CategoryNode | null;
  allCategories: CategoryNode[];
  categoryCounts: Map<number, number>;
  result: { items: ListingCardData[]; total: number; pages: number };
  facets: Record<string, Record<string, number>>;
  saved?: Set<string>;
  basePath: string;
  preview?: boolean;
}

/** Shared presentation for real and visual-preview browse pages. */
export function BrowseLayout({ params, filters, category, allCategories, categoryCounts, result, facets, saved = new Set(), basePath, preview }: BrowseLayoutProps) {
  const sub = category?.children.find((c) => c.slug === filters.sub);
  const view: CardVariant = params.view === "list" ? "list" : "grid";
  const fields = category ? filterableFields(category.schemaKey) : [];
  const chips = buildChips(filters, category);
  const active = activeFilterCount(filters);
  const panelProps = { fields, facets, subcategories: category?.children.map((c) => ({ slug: c.slug, nameAr: c.nameAr })) ?? [], total: result.total, activeCount: active };
  const title = filters.q ? <>نتائج «<bdi>{filters.q}</bdi>»{category ? ` في ${category.nameAr}` : ""}</> : sub?.nameAr ?? category?.nameAr ?? (filters.swap ? "إعلانات تقبل البدل" : filters.verified ? "الإعلانات الموثّقة" : "كل الإعلانات");
  const withView = (sp: URLSearchParams) => {
    if (view === "list") sp.set("view", "list");
    return sp;
  };

  return (
    <div className="container-page pt-4 sm:pt-5">
      <nav aria-label="مسار التنقل" className="mb-3 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">الرئيسية</Link>
        <span aria-hidden>/</span>
        <Link href="/browse" className="hover:text-foreground">الإعلانات</Link>
        {category && (<><span aria-hidden>/</span><Link href={basePath} className="hover:text-foreground">{category.nameAr}</Link></>)}
        {sub && (<><span aria-hidden>/</span><span className="text-foreground">{sub.nameAr}</span></>)}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-3">
          {category && (
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface sm:flex">
              <CategoryIcon icon={category.icon} className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              <span className="font-semibold text-foreground">{listingsCount(result.total)}</span>
              {preview && <span className="ms-2 rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">بيانات نموذجية</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-6 xl:gap-8">
        <FilterPanel {...panelProps} header={<CategoryNav categories={allCategories} counts={categoryCounts} activeSlug={category?.slug} params={filters} />} />
        <div className="min-w-0 flex-1">
          <div className="sticky top-14 z-20 -mx-4 mb-3 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
            <div className="flex items-center gap-2">
              <Suspense fallback={null}><MobileFilterButton {...panelProps} /></Suspense>
              <p className="hidden text-[13px] text-muted-foreground sm:block">{result.total > 0 ? `عرض ${(filters.page - 1) * 24 + 1}–${Math.min(filters.page * 24, result.total)} من ${result.total}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <Suspense fallback={null}><ViewToggle /></Suspense>
              <Suspense fallback={null}><SortSelect /></Suspense>
            </div>
          </div>
          {chips.length > 0 && <div className="mb-3"><Suspense fallback={null}><ActiveFilterChips chips={chips} /></Suspense></div>}

          {result.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="ما لقينا إعلانات تطابق بحثك"
              description="جرّب تخفف الفلاتر أو توسّع نطاق السعر أو المدينة. الإعلانات تنزل يوميًا."
              action={
                <>
                  {active > 0 && <Button asChild variant="outline"><Link href={basePath + (filters.q ? `?q=${encodeURIComponent(filters.q)}` : "")}>مسح الفلاتر</Link></Button>}
                  <Button asChild><Link href="/browse">تصفّح كل الإعلانات</Link></Button>
                </>
              }
            />
          ) : (
            <ListingGrid variant={view} className={view === "grid" ? "md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : undefined}>
              {result.items.map((l, i) => <ListingCard key={l.id} listing={l} variant={view} saved={saved.has(l.id)} priority={i < 4} showFavorite={!preview} />)}
            </ListingGrid>
          )}

          <Pagination
            page={filters.page}
            pages={result.pages}
            hrefFor={(p) => {
              const sp = withView(toSearchParams({ ...filters, page: p }));
              return `${basePath}${sp.size ? `?${sp}` : ""}`;
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Sidebar category list (keeps the current search/filters except spec filters). */
function CategoryNav({ categories, counts, activeSlug, params }: { categories: CategoryNode[]; counts: Map<number, number>; activeSlug?: string; params: BrowseFilters }) {
  const sp = toSearchParams({ ...params, attrs: {}, ranges: {}, sub: undefined, page: 1 });
  const qs = sp.size ? `?${sp}` : "";
  const current = categories.find((c) => c.slug === activeSlug);
  if (current) {
    // Inside a category the spec filters matter most — keep the switcher compact.
    return (
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-2.5">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
          <CategoryIcon icon={current.icon} className="size-4 text-primary" />
          <span className="truncate">{current.nameAr}</span>
          <span className="text-[11px] font-normal text-subtle-foreground num">{counts.get(current.id) ?? 0}</span>
        </span>
        <Link href={`/browse${qs}`} className="shrink-0 text-[12.5px] font-semibold text-primary-ink hover:underline">كل الأقسام</Link>
      </div>
    );
  }
  return (
    <div className="mb-3 rounded-xl border border-border bg-surface p-2">
      <h2 className="px-2 pt-1 pb-1.5 text-[12px] font-semibold text-muted-foreground">الأقسام</h2>
      <ul className="space-y-0.5">
        <li>
          <Link href={`/browse${qs}`} aria-current={!activeSlug ? "page" : undefined} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]", !activeSlug ? "bg-primary-soft font-semibold text-primary-ink" : "hover:bg-surface-2")}>
            <LayoutGrid className="size-4 text-muted-foreground" aria-hidden />كل الأقسام
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/browse/${c.slug}${qs}`} aria-current={activeSlug === c.slug ? "page" : undefined} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]", activeSlug === c.slug ? "bg-primary-soft font-semibold text-primary-ink" : "hover:bg-surface-2")}>
              <CategoryIcon icon={c.icon} className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{c.nameAr}</span>
              <span className="text-[11px] text-subtle-foreground num">{counts.get(c.id) ?? 0}</span>
            </Link>
          </li>
        ))}
      </ul>
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
