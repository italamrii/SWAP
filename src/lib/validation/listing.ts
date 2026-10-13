import "./zod-ar";
import { z } from "zod";
import { CITY_VALUES } from "@/lib/catalog/cities";
import { CONDITION_VALUES } from "@/lib/catalog/conditions";

export const MAX_IMAGES = 10;

/** Only accept image URLs produced by our own storage (or bundled demo art). */
export function isTrustedImageUrl(url: string) {
  const supabase = process.env.SUPABASE_URL;
  return url.startsWith("/api/files/") || url.startsWith("/seed/") || (!!supabase && url.startsWith(`${supabase}/storage/v1/object/public/`));
}

export const listingImageSchema = z.object({
  url: z.string().max(500).refine(isTrustedImageUrl, "مصدر صورة غير مسموح"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const listingBaseSchema = z.object({
  categorySlug: z.string({ required_error: "اختر القسم" }).min(1, "اختر القسم"),
  subcategorySlug: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(8, "العنوان قصير — اذكر الموديل وأهم ميزة").max(90, "العنوان طويل (90 حرفًا كحد أقصى)"),
  description: z.string().trim().min(30, "الوصف قصير — اكتب 30 حرفًا على الأقل عن الحالة وسبب البيع").max(4000, "الوصف طويل جدًا"),
  price: z.coerce.number({ invalid_type_error: "أدخل السعر بالأرقام" }).int("السعر بدون كسور").min(10, "أدخل سعرًا صحيحًا").max(500_000, "السعر أعلى من الحد المسموح"),
  isNegotiable: z.boolean(),
  acceptsSwap: z.boolean(),
  swapDetails: z.string().trim().max(300, "تفاصيل البدل طويلة").optional(),
  condition: z.enum(CONDITION_VALUES, { errorMap: () => ({ message: "اختر حالة القطعة" }) }),
  city: z.enum(CITY_VALUES, { errorMap: () => ({ message: "اختر المدينة" }) }),
  district: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim().min(1).max(24)).max(8, "8 وسوم كحد أقصى").default([]),
  images: z.array(listingImageSchema).min(1, "أضف صورة واحدة على الأقل").max(MAX_IMAGES, `${MAX_IMAGES} صور كحد أقصى`),
  specs: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});

export type ListingInput = z.input<typeof listingBaseSchema>;
