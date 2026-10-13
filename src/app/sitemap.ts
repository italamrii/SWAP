import { desc, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { categories, listings } from "@/lib/db/schema";
import { APP_URL } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, rows] = await Promise.all([
    db.select({ slug: categories.slug, parentId: categories.parentId }).from(categories).where(eq(categories.isActive, true)),
    db.select({ slug: listings.slug, updatedAt: listings.updatedAt }).from(listings).where(eq(listings.status, "active")).orderBy(desc(listings.updatedAt)).limit(5000),
  ]);
  const staticPages = ["", "/browse", "/how-it-works", "/verification", "/safety", "/about", "/contact", "/terms", "/privacy"];
  return [
    ...staticPages.map((p) => ({ url: `${APP_URL}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.6 })),
    ...cats.filter((c) => !c.parentId).map((c) => ({ url: `${APP_URL}/browse/${c.slug}`, changeFrequency: "hourly" as const, priority: 0.8 })),
    ...rows.map((l) => ({ url: `${APP_URL}/listing/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
