export const VERIFICATION_LEVELS = ["unverified", "seller_report", "platform_checked", "partner_verified"] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

export const VERIFICATION_META: Record<
  VerificationLevel,
  { label: string; short: string; description: string; rank: number }
> = {
  unverified: {
    label: "بدون تقرير فحص",
    short: "بدون تقرير",
    description: "لم يُرفق البائع تقرير فحص. اطلب صورًا إضافية أو افحص الجهاز بنفسك قبل الدفع.",
    rank: 0,
  },
  seller_report: {
    label: "تقرير من البائع",
    short: "تقرير البائع",
    description: "أرفق البائع مواصفات وأدلة (صور، لقطات أدوات فحص)، وراجعها فريق سواب للتأكد من اكتمالها واتساقها. البيانات مُدخلة من البائع.",
    rank: 1,
  },
  platform_checked: {
    label: "فحص عبر أداة سواب",
    short: "فحص المنصة",
    description: "جُمعت البيانات آليًا من الجهاز عبر أداة الفحص الخاصة بسواب وتطابقت بصمتها الرقمية، ثم راجعها الفريق.",
    rank: 2,
  },
  partner_verified: {
    label: "فحص لدى شريك معتمد",
    short: "شريك معتمد",
    description: "فُحص الجهاز فعليًا لدى متجر شريك معتمد من سواب وفق قائمة فحص موحّدة.",
    rank: 3,
  },
};

export const INSPECTION_SOURCES = {
  manual: "إدخال يدوي من البائع",
  platform_tool: "أداة الفحص من سواب",
  store_partner: "متجر شريك",
} as const;
export type InspectionSource = keyof typeof INSPECTION_SOURCES;

export const INSPECTION_DISCLAIMER =
  "يعكس هذا التقرير حالة الجهاز وقت الفحص فقط، ولا يُعد ضمانًا مطلقًا لحالته الحالية أو المستقبلية. ننصح دائمًا بمعاينة الجهاز قبل الدفع.";

/** Reports older than this are shown as "قديم" and stop counting as current. */
export const INSPECTION_VALIDITY_DAYS = 90;
