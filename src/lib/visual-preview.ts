import { CATEGORY_SEED } from "@/lib/catalog/categories";
import type { CategoryNode } from "@/server/queries/categories";
import type { ListingCardData } from "@/server/types";

/**
 * Visual-only preview when the Vercel deployment has no database.
 * It contains no real seller data and never simulates a successful transaction.
 * Providing DATABASE_URL automatically restores the real marketplace.
 */
export const VISUAL_PREVIEW = process.env.VERCEL === "1" && !process.env.DATABASE_URL;

export const PREVIEW_CATEGORIES: CategoryNode[] = CATEGORY_SEED.map((c, index) => ({
  id: index + 1,
  slug: c.slug,
  nameAr: c.nameAr,
  nameEn: c.nameEn,
  descriptionAr: c.descriptionAr,
  icon: c.icon,
  schemaKey: c.schemaKey,
  featured: Boolean(c.featured),
  isActive: true,
  sortOrder: index,
  parentId: null,
  children: (c.children ?? []).map((child, i) => ({
    id: 100 + index * 20 + i,
    slug: child.slug,
    nameAr: child.nameAr,
    nameEn: child.nameEn,
    descriptionAr: null,
    icon: c.icon,
    schemaKey: c.schemaKey,
    featured: false,
    isActive: true,
    sortOrder: i,
    parentId: index + 1,
    children: [],
  })),
}));

const SAMPLE: Array<Pick<ListingCardData, "slug" | "title" | "price" | "city" | "condition" | "acceptsSwap" | "isNegotiable" | "verificationLevel" | "categorySlug">> = [
  { slug: "demo-rtx-4070-super", title: "RTX 4070 SUPER 12GB — استخدام نظيف", price: 215000, city: "riyadh", condition: "excellent", acceptsSwap: true, isNegotiable: true, verificationLevel: "platform_checked", categorySlug: "gpus" },
  { slug: "demo-gaming-pc", title: "تجميعة قيمنق Ryzen 7 / RTX 4070 / DDR5 32GB", price: 479000, city: "jeddah", condition: "like_new", acceptsSwap: true, isNegotiable: false, verificationLevel: "seller_report", categorySlug: "pcs" },
  { slug: "demo-macbook", title: "MacBook Air M3 — ذاكرة 16GB وسعة 512GB", price: 359000, city: "dammam", condition: "excellent", acceptsSwap: false, isNegotiable: true, verificationLevel: "unverified", categorySlug: "laptops" },
  { slug: "demo-monitor", title: "شاشة قيمنق 27 بوصة QHD 165Hz", price: 85000, city: "riyadh", condition: "good", acceptsSwap: true, isNegotiable: true, verificationLevel: "unverified", categorySlug: "monitors" },
  { slug: "demo-ryzen", title: "معالج AMD Ryzen 7 7800X3D", price: 119000, city: "jeddah", condition: "like_new", acceptsSwap: false, isNegotiable: true, verificationLevel: "seller_report", categorySlug: "cpus" },
  { slug: "demo-ddr5", title: "رامات Kingston Fury 32GB DDR5 6000", price: 65000, city: "medina", condition: "excellent", acceptsSwap: true, isNegotiable: true, verificationLevel: "unverified", categorySlug: "ram" },
  { slug: "demo-ssd", title: "Samsung 990 PRO NVMe 2TB", price: 47000, city: "riyadh", condition: "excellent", acceptsSwap: false, isNegotiable: true, verificationLevel: "seller_report", categorySlug: "storage" },
  { slug: "demo-laptop", title: "لابتوب ASUS ROG RTX 4060 / i7 / 16GB", price: 345000, city: "abha", condition: "excellent", acceptsSwap: true, isNegotiable: true, verificationLevel: "unverified", categorySlug: "laptops" },
];
const publishedAt = new Date("2026-10-11T09:00:00Z");
export const PREVIEW_LISTINGS: ListingCardData[] = SAMPLE.map((s, i) => {
  const category = PREVIEW_CATEGORIES.find((c) => c.slug === s.categorySlug)!;
  return {
    ...s,
    id: "preview-" + String(i + 1),
    categoryNameAr: category.nameAr,
    categoryIcon: category.icon,
    schemaKey: category.schemaKey,
    specs: {},
    coverImageUrl: null,
    status: "active",
    publishedAt,
    bumpedAt: publishedAt,
  };
});
