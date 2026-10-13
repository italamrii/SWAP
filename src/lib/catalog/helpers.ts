import "../validation/zod-ar";
import { z } from "zod";
import { getSpecSchema } from "./specs";
import type { SpecField, SpecValues } from "./types";

export const TRISTATE_LABELS: Record<string, string> = { yes: "نعم", no: "لا", unknown: "غير معروف" };

export function formatSpecValue(field: SpecField, raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  switch (field.type) {
    case "boolean":
      return raw === true || raw === "true" ? "نعم" : "لا";
    case "tristate":
      return TRISTATE_LABELS[String(raw)] ?? String(raw);
    case "select": {
      const opt = field.options?.find((o) => o.value === String(raw));
      const label = opt?.label ?? String(raw);
      return field.unit && !/[A-Za-z]{2}$/.test(label) ? `${label}${field.unit === "″" ? "″" : ` ${field.unit}`}` : label;
    }
    case "number":
      return field.unit ? `${raw}${field.unit === "%" || field.unit === "°C" ? "" : " "}${field.unit}` : String(raw);
    default:
      return String(raw);
  }
}

/** One-line summary for cards, e.g. "RTX 4070 Super · 12GB · لم يُعدَّن". */
export function specSummary(schemaKey: string, specs: SpecValues, max = 3): string[] {
  const schema = getSpecSchema(schemaKey);
  if (!schema) return [];
  const parts: string[] = [];
  for (const field of schema.fields) {
    if (!field.highlight) continue;
    const raw = specs[field.key];
    if (raw === undefined || raw === null || raw === "") continue;
    if (field.key === "mined") {
      if (raw === "no") parts.push("بدون تعدين");
      else if (raw === "yes") parts.push("مستخدم للتعدين");
      continue;
    }
    const v = formatSpecValue(field, raw);
    if (v) parts.push(v);
    if (parts.length >= max) break;
  }
  return parts;
}

/** Build a zod validator for a category's specs (server + client). */
export function specValidator(schemaKey: string) {
  const schema = getSpecSchema(schemaKey);
  if (!schema) return z.record(z.any()).transform(() => ({}) as SpecValues);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of schema.fields) {
    let v: z.ZodTypeAny;
    switch (f.type) {
      case "number": {
        let n = z.coerce.number({ invalid_type_error: `${f.label}: أدخل رقمًا` });
        if (f.min !== undefined) n = n.min(f.min, `${f.label}: الحد الأدنى ${f.min}`);
        if (f.max !== undefined) n = n.max(f.max, `${f.label}: الحد الأعلى ${f.max}`);
        v = z.preprocess((x) => (x === "" || x === null ? undefined : x), f.required ? n : n.optional());
        break;
      }
      case "boolean":
        v = z.preprocess((x) => x === true || x === "true" || x === "on", z.boolean());
        break;
      case "tristate": {
        const e = z.enum(["yes", "no", "unknown"], { errorMap: () => ({ message: `اختر ${f.label}` }) });
        v = z.preprocess((x) => (x === "" ? undefined : x), f.required ? e : e.optional());
        break;
      }
      case "select": {
        const values = (f.options ?? []).map((o) => o.value) as [string, ...string[]];
        const e = z.enum(values, { errorMap: () => ({ message: `اختر ${f.label}` }) });
        v = z.preprocess((x) => (x === "" ? undefined : x), f.required ? e : e.optional());
        break;
      }
      default: {
        const s = z.string({ required_error: `${f.label} مطلوب`, invalid_type_error: `${f.label} مطلوب` }).trim().max(120, `${f.label}: النص طويل`);
        v = z.preprocess(
          (x) => (typeof x === "string" && x.trim() === "" ? undefined : x),
          f.required ? s.min(1, `${f.label} مطلوب`) : s.optional(),
        );
      }
    }
    shape[f.key] = v;
  }
  return z.object(shape).transform((obj) => {
    const out: SpecValues = {};
    for (const [k, val] of Object.entries(obj)) if (val !== undefined) out[k] = val as SpecValues[string];
    return out;
  });
}

export interface AttributeRow {
  key: string;
  valueText: string | null;
  valueNum: number | null;
}

/** Normalized attribute rows for filterable fields (listing_attributes). */
export function toAttributeRows(schemaKey: string, specs: SpecValues): AttributeRow[] {
  const schema = getSpecSchema(schemaKey);
  if (!schema) return [];
  const rows: AttributeRow[] = [];
  for (const f of schema.fields) {
    if (!f.filterable) continue;
    const raw = specs[f.key];
    if (raw === undefined || raw === null || raw === "") continue;
    if (f.type === "number") rows.push({ key: f.key, valueText: null, valueNum: Number(raw) });
    else if (f.type === "boolean") rows.push({ key: f.key, valueText: raw ? "true" : "false", valueNum: null });
    else {
      const num = Number(raw);
      rows.push({ key: f.key, valueText: String(raw), valueNum: Number.isFinite(num) ? num : null });
    }
  }
  return rows;
}

export function filterableFields(schemaKey: string): SpecField[] {
  return getSpecSchema(schemaKey)?.fields.filter((f) => f.filterable) ?? [];
}
