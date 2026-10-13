import { CITY_VALUES } from "./catalog/cities";
import { CONDITION_VALUES } from "./catalog/conditions";
import { getSpecSchema } from "./catalog/specs";

export const SORTS = {
  newest: "الأحدث",
  price_asc: "السعر: من الأقل",
  price_desc: "السعر: من الأعلى",
  verified: "الموثّقة أولًا",
} as const;
export type SortKey = keyof typeof SORTS;

export const PAGE_SIZE = 24;

export interface BrowseFilters {
  q?: string;
  sub?: string;
  city?: string;
  min?: number; // SAR
  max?: number; // SAR
  conditions: string[];
  verified: boolean;
  swap: boolean;
  negotiable: boolean;
  /** select / tristate / boolean spec filters: key → accepted values */
  attrs: Record<string, string[]>;
  /** numeric spec filters */
  ranges: Record<string, { min?: number; max?: number }>;
  sort: SortKey;
  page: number;
}

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);

/**
 * Parse URL search params into typed, whitelisted filters.
 * Spec filters use `f.<key>=a,b` and `f.<key>.min / f.<key>.max` and are only
 * accepted for fields that are marked filterable in the category schema.
 */
export function parseBrowseParams(params: Params, schemaKey?: string): BrowseFilters {
  const q = first(params.q)?.trim().slice(0, 80) || undefined;
  const city = first(params.city);
  const sort = first(params.sort) as SortKey;
  const page = Math.max(1, Math.min(500, Math.floor(num(first(params.page)) ?? 1)));
  const filters: BrowseFilters = {
    q,
    sub: first(params.sub) || undefined,
    city: city && (CITY_VALUES as readonly string[]).includes(city) ? city : undefined,
    min: num(first(params.min)),
    max: num(first(params.max)),
    conditions: list(params.condition).filter((c) => (CONDITION_VALUES as readonly string[]).includes(c)),
    verified: first(params.verified) === "1",
    swap: first(params.swap) === "1",
    negotiable: first(params.negotiable) === "1",
    attrs: {},
    ranges: {},
    sort: sort in SORTS ? sort : "newest",
    page,
  };

  const schema = schemaKey ? getSpecSchema(schemaKey) : undefined;
  for (const field of schema?.fields ?? []) {
    if (!field.filterable) continue;
    if (field.type === "number") {
      const min = num(first(params[`f.${field.key}.min`]));
      const max = num(first(params[`f.${field.key}.max`]));
      if (min !== undefined || max !== undefined) filters.ranges[field.key] = { min, max };
      continue;
    }
    const allowed =
      field.type === "boolean" ? ["true"] : field.type === "tristate" ? ["yes", "no", "unknown"] : (field.options ?? []).map((o) => o.value);
    const values = list(params[`f.${field.key}`]).filter((v) => allowed.includes(v));
    if (values.length) filters.attrs[field.key] = values;
  }
  return filters;
}

/** Inverse of parseBrowseParams — used to build links that toggle a single filter. */
export function toSearchParams(f: Partial<BrowseFilters>): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.sub) sp.set("sub", f.sub);
  if (f.city) sp.set("city", f.city);
  if (f.min !== undefined) sp.set("min", String(f.min));
  if (f.max !== undefined) sp.set("max", String(f.max));
  if (f.conditions?.length) sp.set("condition", f.conditions.join(","));
  if (f.verified) sp.set("verified", "1");
  if (f.swap) sp.set("swap", "1");
  if (f.negotiable) sp.set("negotiable", "1");
  for (const [k, v] of Object.entries(f.attrs ?? {})) if (v.length) sp.set(`f.${k}`, v.join(","));
  for (const [k, r] of Object.entries(f.ranges ?? {})) {
    if (r.min !== undefined) sp.set(`f.${k}.min`, String(r.min));
    if (r.max !== undefined) sp.set(`f.${k}.max`, String(r.max));
  }
  if (f.sort && f.sort !== "newest") sp.set("sort", f.sort);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  return sp;
}

export function activeFilterCount(f: BrowseFilters) {
  return (
    (f.sub ? 1 : 0) + (f.city ? 1 : 0) + (f.min !== undefined || f.max !== undefined ? 1 : 0) +
    f.conditions.length + (f.verified ? 1 : 0) + (f.swap ? 1 : 0) + (f.negotiable ? 1 : 0) +
    Object.values(f.attrs).reduce((a, v) => a + v.length, 0) + Object.keys(f.ranges).length
  );
}
