import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowseLayout, BrowseView } from "@/components/listings/browse-view";
import { parseBrowseParams } from "@/lib/browse-params";
import { PREVIEW_CATEGORIES, VISUAL_PREVIEW, previewFacets, previewHomeData, previewSearch } from "@/lib/visual-preview";
import { getCategoryBySlug, getCategoryCounts, getCategoryTree } from "@/server/queries/categories";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = VISUAL_PREVIEW ? PREVIEW_CATEGORIES.find((c) => c.slug === category) : await getCategoryBySlug(category);
  if (!cat) return {};
  const title = `${cat.nameAr} مستعملة للبيع والبدل`;
  return {
    title,
    description: `${cat.descriptionAr ?? ""} تصفّح ${cat.nameAr} المستعملة في السعودية مع مواصفات منظّمة وتقارير فحص اختيارية.`.trim(),
    alternates: { canonical: `/browse/${cat.slug}` },
    openGraph: { title, url: `/browse/${cat.slug}` },
    robots: VISUAL_PREVIEW ? { index: false } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  if (VISUAL_PREVIEW) {
    const cat = PREVIEW_CATEGORIES.find((c) => c.slug === category);
    if (!cat) notFound();
    const filters = parseBrowseParams(sp, cat.schemaKey);
    return (
      <BrowseLayout preview params={sp} filters={filters} category={cat} allCategories={PREVIEW_CATEGORIES} categoryCounts={previewHomeData().counts}
        result={previewSearch({ ...filters, categorySlug: cat.slug, subSlug: filters.sub })} facets={previewFacets(cat.slug)} basePath={`/browse/${cat.slug}`} />
    );
  }
  const [all, counts] = await Promise.all([getCategoryTree(), getCategoryCounts()]);
  const cat = all.find((c) => c.slug === category);
  if (!cat) notFound();
  return <BrowseView params={sp} category={cat} allCategories={all} categoryCounts={counts} basePath={`/browse/${cat.slug}`} />;
}
