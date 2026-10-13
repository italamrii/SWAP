import type { Metadata } from "next";
import { BrowseLayout, BrowseView } from "@/components/listings/browse-view";
import { parseBrowseParams } from "@/lib/browse-params";
import { PREVIEW_CATEGORIES, VISUAL_PREVIEW, previewHomeData, previewSearch } from "@/lib/visual-preview";
import { getCategoryCounts, getCategoryTree } from "@/server/queries/categories";

export const metadata: Metadata = {
  title: "تصفّح الإعلانات",
  description: "تصفّح أجهزة الكمبيوتر واللابتوبات والقطع المستعملة في السعودية، مع فلاتر حسب المواصفات والمدينة ومستوى التوثيق.",
  alternates: { canonical: "/browse" },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function BrowsePage({ searchParams }: { searchParams: SP }) {
  const params = await searchParams;
  if (VISUAL_PREVIEW) {
    const filters = parseBrowseParams(params);
    return <BrowseLayout preview params={params} filters={filters} category={null} allCategories={PREVIEW_CATEGORIES} categoryCounts={previewHomeData().counts} result={previewSearch(filters)} facets={{}} basePath="/browse" />;
  }
  const [categories, counts] = await Promise.all([getCategoryTree(), getCategoryCounts()]);
  return <BrowseView params={params} category={null} allCategories={categories} categoryCounts={counts} basePath="/browse" />;
}
