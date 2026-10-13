import type { Metadata } from "next";
import { VISUAL_PREVIEW } from "@/lib/visual-preview";
import { PreviewBrowse } from "@/components/preview/preview-browse";
import { BrowseView } from "@/components/listings/browse-view";
import { getCategoryTree } from "@/server/queries/categories";

export const metadata: Metadata = {
  title: "تصفّح الإعلانات",
  description: "تصفّح أجهزة الكمبيوتر واللابتوبات والقطع المستعملة في السعودية، مع فلاتر حسب المواصفات والمدينة ومستوى التوثيق.",
  alternates: { canonical: "/browse" },
};

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (VISUAL_PREVIEW) return <PreviewBrowse params={await searchParams} />;
  const [params, categories] = await Promise.all([searchParams, getCategoryTree()]);
  return <BrowseView params={params} category={null} allCategories={categories} basePath="/browse" />;
}
