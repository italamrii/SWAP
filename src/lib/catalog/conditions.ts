export const CONDITIONS = [
  { value: "new", label: "جديد", hint: "مختوم أو لم يُستخدم إطلاقًا" },
  { value: "like_new", label: "كالجديد", hint: "استخدام بسيط جدًا، بلا أي أثر" },
  { value: "excellent", label: "ممتاز", hint: "مستخدم بعناية، آثار لا تكاد تُرى" },
  { value: "good", label: "جيد", hint: "آثار استخدام واضحة، يعمل بكفاءة" },
  { value: "fair", label: "مقبول", hint: "آثار واضحة أو ملاحظة بسيطة موضّحة في الوصف" },
  { value: "for_parts", label: "للقطع / عطلان", hint: "لا يعمل أو به عطل موضّح" },
] as const;

export type Condition = (typeof CONDITIONS)[number]["value"];
export const CONDITION_VALUES = CONDITIONS.map((c) => c.value) as [Condition, ...Condition[]];

export function conditionLabel(value: string) {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}
