import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import { categories, listings } from "@/lib/db/schema";

export interface CategoryNode {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  icon: string;
  schemaKey: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
  parentId: number | null;
  children: CategoryNode[];
}

export const getCategoryTree = cache(async (opts: { includeInactive?: boolean } = {}) => {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  const nodes = rows
    .filter((r) => opts.includeInactive || r.isActive)
    .map<CategoryNode>((r) => ({ ...r, children: [] }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: CategoryNode[] = [];
  for (const n of nodes) {
    if (n.parentId && byId.has(n.parentId)) byId.get(n.parentId)!.children.push(n);
    else if (!n.parentId) roots.push(n);
  }
  return roots;
});

export async function getCategoryBySlug(slug: string) {
  const tree = await getCategoryTree();
  return tree.find((c) => c.slug === slug) ?? null;
}

/** Active listing counts per root category. */
export const getCategoryCounts = cache(async () => {
  const rows = await db
    .select({ categoryId: listings.categoryId, count: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.status, "active"))
    .groupBy(listings.categoryId);
  return new Map(rows.map((r) => [r.categoryId, r.count]));
});
