import { PAGE_SIZE, type BrowseFilters } from "@/lib/browse-params";
import { CATEGORY_SEED } from "@/lib/catalog/categories";
import { getSpecSchema } from "@/lib/catalog/specs";
import { isVisualPreview } from "@/lib/preview-mode";
import { SEED_LISTINGS, type SeedListing } from "@/lib/sample-data/listings";
import { SAMPLE_PROFILES } from "@/lib/sample-data/users";
import { slugify } from "@/lib/slug";
import type { CategoryNode } from "@/server/queries/categories";
import type { ApprovedInspection, ListingDetail } from "@/server/queries/listings";
import type { ListingCardData } from "@/server/types";

/**
 * Database-free visual preview. Uses the same fictional catalogue as the local seed,
 * rendered through the real marketplace components, and is always clearly labeled.
 * Transactions (messages, offers, sign-in) are disabled in this mode.
 */
export const VISUAL_PREVIEW = isVisualPreview();

const DAY = 864e5;
const NOW = Date.now();
const ago = (days: number, hours = 0) => new Date(NOW - days * DAY - hours * 36e5);

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

type Entry = { seed: SeedListing; index: number; card: ListingCardData; sellerKey: string };

const ENTRIES: Entry[] = SEED_LISTINGS.flatMap((seed, index) => {
  const status = seed.status ?? "active";
  if (status !== "active" && status !== "sold") return [];
  const category = PREVIEW_CATEGORIES.find((c) => c.slug === seed.category)!;
  const seller = SAMPLE_PROFILES.find((p) => p.key === seed.seller)!;
  const verified = seed.inspection && (seed.inspection.status ?? "approved") === "approved" ? seed.inspection.level : "unverified";
  const created = ago(seed.daysAgo, index % 7);
  const card: ListingCardData = {
    id: `preview-${index}`,
    slug: `sample-${index}-${slugify(seed.title, 48)}`,
    title: seed.title,
    price: seed.price * 100,
    city: seed.city ?? seller.city,
    condition: seed.condition,
    acceptsSwap: seed.swap ?? false,
    isNegotiable: seed.negotiable ?? true,
    verificationLevel: verified,
    coverImageUrl: `/seed/${seed.images[0]}.svg`,
    specs: seed.specs,
    status,
    publishedAt: created,
    bumpedAt: created,
    categorySlug: category.slug,
    categoryNameAr: category.nameAr,
    categoryIcon: category.icon,
    schemaKey: category.schemaKey,
  };
  return [{ seed, index, card, sellerKey: seller.key }];
});

export const PREVIEW_LISTINGS: ListingCardData[] = ENTRIES.map((e) => e.card);
const ACTIVE = () => ENTRIES.filter((e) => e.card.status === "active");

export function previewHomeData() {
  const active = ACTIVE().map((e) => e.card).sort((a, b) => b.bumpedAt.getTime() - a.bumpedAt.getTime());
  const counts = new Map(PREVIEW_CATEGORIES.map((c) => [c.id, active.filter((l) => l.categorySlug === c.slug).length]));
  return {
    categories: PREVIEW_CATEGORIES,
    counts,
    latest: active.slice(0, 12),
    verified: active.filter((l) => l.verificationLevel !== "unverified").slice(0, 6),
    swaps: active.filter((l) => l.acceptsSwap).slice(0, 6),
    stats: { active: active.length, verified: active.filter((l) => l.verificationLevel !== "unverified").length, swap: active.filter((l) => l.acceptsSwap).length },
  };
}

/** In-memory equivalent of searchListings(), sharing BrowseFilters semantics. */
export function previewSearch(f: BrowseFilters & { categorySlug?: string; subSlug?: string }) {
  const q = f.q?.toLowerCase();
  let rows = ACTIVE().filter(({ seed, card }) => {
    if (f.categorySlug && card.categorySlug !== f.categorySlug) return false;
    if (f.subSlug && seed.sub !== f.subSlug) return false;
    if (q && !`${card.title} ${seed.description} ${(seed.tags ?? []).join(" ")}`.toLowerCase().includes(q)) return false;
    if (f.city && card.city !== f.city) return false;
    if (f.min !== undefined && card.price < f.min * 100) return false;
    if (f.max !== undefined && card.price > f.max * 100) return false;
    if (f.conditions.length && !f.conditions.includes(card.condition)) return false;
    if (f.verified && card.verificationLevel === "unverified") return false;
    if (f.swap && !card.acceptsSwap) return false;
    if (f.negotiable && !card.isNegotiable) return false;
    for (const [k, vals] of Object.entries(f.attrs)) if (!vals.includes(String(card.specs[k]))) return false;
    for (const [k, r] of Object.entries(f.ranges)) {
      const n = Number(card.specs[k]);
      if (!Number.isFinite(n) || (r.min !== undefined && n < r.min) || (r.max !== undefined && n > r.max)) return false;
    }
    return true;
  }).map((e) => e.card);
  const rank = { unverified: 0, seller_report: 1, platform_checked: 2, partner_verified: 3 } as const;
  rows = rows.sort((a, b) =>
    f.sort === "price_asc" ? a.price - b.price
    : f.sort === "price_desc" ? b.price - a.price
    : f.sort === "verified" ? rank[b.verificationLevel] - rank[a.verificationLevel] || b.bumpedAt.getTime() - a.bumpedAt.getTime()
    : b.bumpedAt.getTime() - a.bumpedAt.getTime(),
  );
  const total = rows.length;
  return { items: rows.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE), total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function previewFacets(categorySlug: string) {
  const out: Record<string, Record<string, number>> = {};
  const schema = getSpecSchema(PREVIEW_CATEGORIES.find((c) => c.slug === categorySlug)?.schemaKey ?? "");
  for (const { card } of ACTIVE().filter((e) => e.card.categorySlug === categorySlug)) {
    for (const field of schema?.fields ?? []) {
      if (!field.filterable || field.type === "number") continue;
      const v = card.specs[field.key];
      if (v === undefined || v === null || v === "") continue;
      const key = String(v);
      (out[field.key] ??= {})[key] = (out[field.key][key] ?? 0) + 1;
    }
  }
  return out;
}

function previewSellerSummary(key: string) {
  const p = SAMPLE_PROFILES.find((x) => x.key === key)!;
  return {
    id: `preview-user-${p.key}`,
    createdAt: ago(p.joinedDaysAgo),
    status: "active" as const,
    trusted: p.trusted ?? false,
    lastSeenAt: ago(0, 2),
    username: p.username,
    displayName: p.displayName,
    avatarUrl: null,
    city: p.city,
    phone: null,
    showPhone: false,
    responseRate: p.responseRate ?? null,
    responseTimeMinutes: p.responseTimeMinutes ?? null,
    completedDeals: p.completedDeals ?? 0,
  };
}

function sellerStats(key: string) {
  const mine = ENTRIES.filter((e) => e.sellerKey === key);
  return {
    active: mine.filter((e) => e.card.status === "active").length,
    sold: mine.filter((e) => e.card.status === "sold").length,
    verified: mine.filter((e) => e.card.verificationLevel !== "unverified").length,
  };
}

function sampleInspection(e: Entry): ApprovedInspection | null {
  const ins = e.seed.inspection;
  if (!ins || (ins.status ?? "approved") !== "approved") return null;
  const id = `preview-insp-${e.index}`;
  const r = ins.report;
  return {
    id,
    listingId: e.card.id,
    submittedById: `preview-user-${e.sellerKey}`,
    source: ins.source,
    status: "approved",
    requestedLevel: ins.level,
    grantedLevel: ins.level,
    partnerName: ins.partnerName ?? null,
    verificationCode: `SW-${String(1000 + e.index * 37).slice(-4)}`,
    inspectedAt: ago(ins.daysAgo, 3),
    submittedAt: ago(ins.daysAgo, 2),
    reviewedAt: ago(ins.daysAgo),
    reviewerId: null,
    reviewNote: null,
    createdAt: ago(ins.daysAgo, 3),
    updatedAt: ago(ins.daysAgo),
    report: {
      id: `${id}-report`,
      inspectionId: id,
      cpuModel: r.cpuModel ?? null,
      gpuModel: r.gpuModel ?? null,
      motherboard: r.motherboard ?? null,
      ramCapacityGb: r.ramCapacityGb ?? null,
      ramSpeedMhz: r.ramSpeedMhz ?? null,
      storage: r.storage ?? [],
      temperatures: r.temperatures ?? {},
      batteryHealthPct: r.batteryHealthPct ?? null,
      batteryCycles: r.batteryCycles ?? null,
      screenNotes: r.screenNotes ?? null,
      portsNotes: r.portsNotes ?? null,
      checklist: Object.entries(r.checklist ?? {}).map(([key, ok]) => ({ key, ok })),
      benchmarks: r.benchmarks ?? [],
      stressTest: r.stressTest ?? {},
      os: r.os ?? null,
      summary: r.summary ?? null,
      rawPayload: null,
      agentVersion: ins.source === "platform_tool" ? "swap-inspect (sample)" : null,
      checksum: null,
      createdAt: ago(ins.daysAgo),
      updatedAt: ago(ins.daysAgo),
    },
    attachments: [],
  };
}

export function previewListingDetail(slug: string): ListingDetail | null {
  const e = ENTRIES.find((x) => x.card.slug === slug);
  if (!e) return null;
  const { seed, card } = e;
  const category = PREVIEW_CATEGORIES.find((c) => c.slug === card.categorySlug)!;
  const sub = seed.sub ? category.children.find((c) => c.slug === seed.sub) : undefined;
  const seller = previewSellerSummary(e.sellerKey);
  return {
    listing: {
      id: card.id,
      slug: card.slug,
      sellerId: seller.id,
      categoryId: category.id,
      subcategoryId: sub?.id ?? null,
      title: card.title,
      description: seed.description,
      price: card.price,
      isNegotiable: card.isNegotiable,
      acceptsSwap: card.acceptsSwap,
      swapDetails: seed.swapDetails ?? null,
      condition: seed.condition,
      city: card.city,
      district: null,
      specs: seed.specs,
      tags: seed.tags ?? [],
      status: card.status as "active",
      moderationNote: null,
      verificationLevel: card.verificationLevel,
      coverImageUrl: card.coverImageUrl,
      viewCount: seed.views ?? 0,
      favoriteCount: 0,
      publishedAt: card.publishedAt,
      soldAt: card.status === "sold" ? ago(Math.max(0, seed.daysAgo - 3)) : null,
      bumpedAt: card.bumpedAt,
      searchVector: "",
      createdAt: card.bumpedAt,
      updatedAt: card.bumpedAt,
    },
    category: { id: category.id, slug: category.slug, nameAr: category.nameAr, icon: category.icon, schemaKey: category.schemaKey },
    subcategory: sub ? { id: sub.id, slug: sub.slug, nameAr: sub.nameAr } : null,
    seller,
    images: seed.images.map((img, position) => ({ id: `${card.id}-img-${position}`, listingId: card.id, url: `/seed/${img}.svg`, width: 800, height: 600, position, alt: card.title, createdAt: card.bumpedAt })),
    inspection: sampleInspection(e),
    sellerStats: sellerStats(e.sellerKey),
    lastPriceChange: seed.oldPrice ? { id: `${card.id}-price`, listingId: card.id, oldPrice: seed.oldPrice * 100, newPrice: card.price, createdAt: ago(0, 5) } : null,
  };
}

export function previewRelated(slug: string) {
  const e = ENTRIES.find((x) => x.card.slug === slug);
  if (!e) return { similar: [], more: [] };
  const active = ACTIVE().filter((x) => x.card.id !== e.card.id);
  return {
    similar: active.filter((x) => x.card.categorySlug === e.card.categorySlug).slice(0, 6).map((x) => x.card),
    more: active.filter((x) => x.sellerKey === e.sellerKey).slice(0, 6).map((x) => x.card),
  };
}

export function previewSeller(username: string) {
  const p = SAMPLE_PROFILES.find((x) => x.username.toLowerCase() === username.toLowerCase() && !x.role);
  if (!p) return null;
  const items = ENTRIES.filter((e) => e.sellerKey === p.key).map((e) => e.card);
  return { seller: { ...previewSellerSummary(p.key), bio: p.bio ?? null }, stats: sellerStats(p.key), items };
}

export function previewSuggest(q: string) {
  const needle = q.toLowerCase();
  return {
    listings: ACTIVE()
      .filter((e) => e.card.title.toLowerCase().includes(needle))
      .slice(0, 6)
      .map((e) => ({ slug: e.card.slug, title: e.card.title, price: e.card.price, categoryNameAr: e.card.categoryNameAr })),
    categories: PREVIEW_CATEGORIES.filter((c) => c.nameAr.includes(q) || c.nameEn.toLowerCase().includes(needle)).slice(0, 3).map((c) => ({ slug: c.slug, nameAr: c.nameAr })),
  };
}
