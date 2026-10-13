import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowseView } from "@/components/listings/browse-view";
import { getCategoryBySlug, getCategoryTree } from "@/server/queries/categories";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return {};
  const title = `${cat.nameAr} مستعملة للبيع والبدل`;
  return {
    title,
    description: `${cat.descriptionAr ?? ""} تصفّح ${cat.nameAr} المستعملة في السعودية مع مواصفات منظّمة وتقارير فحص اختيارية.`.trim(),
    alternates: { canonical: `/browse/${cat.slug}` },
    openGraph: { title, url: `/browse/${cat.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp, all] = await Promise.all([params, searchParams, getCategoryTree()]);
  const cat = all.find((c) => c.slug === category);
  if (!cat) notFound();
  return <BrowseView params={sp} category={cat} allCategories={all} basePath={`/browse/${cat.slug}`} />;
}
