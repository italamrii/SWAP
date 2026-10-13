import { NextResponse } from "next/server";
import { VISUAL_PREVIEW, PREVIEW_CATEGORIES, PREVIEW_LISTINGS } from "@/lib/visual-preview";
import { getCategoryTree } from "@/server/queries/categories";
import { suggestListings } from "@/server/queries/listings";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 60) ?? "";
  if (q.length < 2) return NextResponse.json({ listings: [], categories: [] });
  if (VISUAL_PREVIEW) return NextResponse.json({ listings: PREVIEW_LISTINGS.filter((l) => l.title.toLowerCase().includes(q.toLowerCase())).slice(0, 5).map((l) => ({ slug: l.slug, title: l.title, price: l.price, categoryNameAr: l.categoryNameAr })), categories: PREVIEW_CATEGORIES.filter((c) => c.nameAr.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase())).slice(0, 3).map((c) => ({ slug: c.slug, nameAr: c.nameAr })) });
  const [listings, tree] = await Promise.all([suggestListings(q), getCategoryTree()]);
  const needle = q.toLowerCase();
  const categories = tree
    .flatMap((c) => [c, ...c.children])
    .filter((c) => c.nameAr.includes(q) || c.nameEn.toLowerCase().includes(needle))
    .slice(0, 3)
    .map((c) => ({ slug: c.parentId ? `${tree.find((p) => p.id === c.parentId)?.slug}?sub=${c.slug}` : c.slug, nameAr: c.nameAr }));
  return NextResponse.json({ listings, categories }, { headers: { "Cache-Control": "private, max-age=30" } });
}
