export const CITIES = [
  { value: "riyadh", label: "الرياض" },
  { value: "jeddah", label: "جدة" },
  { value: "makkah", label: "مكة المكرمة" },
  { value: "madinah", label: "المدينة المنورة" },
  { value: "dammam", label: "الدمام" },
  { value: "khobar", label: "الخبر" },
  { value: "dhahran", label: "الظهران" },
  { value: "ahsa", label: "الأحساء" },
  { value: "qatif", label: "القطيف" },
  { value: "jubail", label: "الجبيل" },
  { value: "taif", label: "الطائف" },
  { value: "tabuk", label: "تبوك" },
  { value: "buraydah", label: "بريدة" },
  { value: "unaizah", label: "عنيزة" },
  { value: "hail", label: "حائل" },
  { value: "abha", label: "أبها" },
  { value: "khamis", label: "خميس مشيط" },
  { value: "jazan", label: "جازان" },
  { value: "najran", label: "نجران" },
  { value: "baha", label: "الباحة" },
  { value: "yanbu", label: "ينبع" },
  { value: "sakaka", label: "سكاكا" },
  { value: "arar", label: "عرعر" },
  { value: "hafr", label: "حفر الباطن" },
] as const;

export type City = (typeof CITIES)[number]["value"];
export const CITY_VALUES = CITIES.map((c) => c.value) as [City, ...City[]];

export function cityLabel(value: string | null | undefined) {
  return CITIES.find((c) => c.value === value)?.label ?? value ?? "";
}
