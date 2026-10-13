import "./zod-ar";
import { z } from "zod";
import { CONDITION_VALUES } from "@/lib/catalog/conditions";

const sar = (label: string) =>
  z.coerce.number({ invalid_type_error: `${label}: أدخل رقمًا` }).int(`${label}: بدون كسور`).min(0, `${label} لا يمكن أن يكون سالبًا`).max(500_000, `${label} كبير جدًا`);

export const priceOfferSchema = z.object({
  listingId: z.string().uuid(),
  amount: sar("المبلغ").min(1, "أدخل مبلغ العرض"),
  note: z.string().trim().max(500, "الملاحظة طويلة").optional(),
});

export const swapOfferSchema = z
  .object({
    listingId: z.string().uuid(),
    offeredTitle: z.string().trim().min(4, "اكتب اسم القطعة التي تعرضها").max(140, "العنوان طويل"),
    offeredCategoryId: z.coerce.number().int().positive().optional(),
    offeredCondition: z.enum(CONDITION_VALUES, { errorMap: () => ({ message: "اختر حالة القطعة" }) }),
    offeredDescription: z.string().trim().max(1000, "الوصف طويل").optional(),
    offeredListingId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
    cashDirection: z.enum(["none", "buyer_pays", "seller_pays"]),
    cashAmount: sar("فرق السعر").default(0),
    note: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.cashDirection === "none" || d.cashAmount > 0, { path: ["cashAmount"], message: "أدخل مبلغ الفرق أو اختر «بدون فرق»" });

export type SwapOfferInput = z.input<typeof swapOfferSchema>;

export const reportSchema = z.object({
  targetType: z.enum(["listing", "user", "message"]),
  targetId: z.string().uuid(),
  reason: z.enum(["scam", "fake_specs", "stolen", "prohibited", "duplicate", "abuse", "wrong_category", "other"], { errorMap: () => ({ message: "اختر سبب البلاغ" }) }),
  details: z.string().trim().max(1000, "التفاصيل طويلة").optional(),
});

export const REPORT_REASONS: Record<z.infer<typeof reportSchema>["reason"], string> = {
  scam: "احتيال أو طلب تحويل مسبق",
  fake_specs: "مواصفات أو صور غير صحيحة",
  stolen: "يُشتبه أنه مسروق",
  prohibited: "منتج مخالف أو ممنوع",
  duplicate: "إعلان مكرر",
  abuse: "إساءة أو سلوك غير لائق",
  wrong_category: "قسم خاطئ",
  other: "سبب آخر",
};
