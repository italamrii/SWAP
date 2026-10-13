import type { SpecOption } from "./types";

export const opts = (...values: (string | [string, string])[]): SpecOption[] =>
  values.map((v) => (Array.isArray(v) ? { value: v[0], label: v[1] } : { value: v, label: v }));

export const gbOpts = (...values: number[]): SpecOption[] =>
  values.map((v) => ({ value: String(v), label: v >= 1024 ? `${v / 1024}TB` : `${v}GB` }));

export const WARRANTY = opts(
  ["agent", "ضمان وكيل ساري"],
  ["store", "ضمان متجر ساري"],
  ["expired", "منتهي"],
  ["none", "بدون ضمان"],
);

export const AGE = opts(
  ["lt6m", "أقل من 6 أشهر"],
  ["6to12m", "6 – 12 شهر"],
  ["1to2y", "سنة إلى سنتين"],
  ["2to3y", "2 – 3 سنوات"],
  ["gt3y", "أكثر من 3 سنوات"],
);

export const RAM_SIZES = gbOpts(4, 8, 12, 16, 18, 24, 32, 36, 48, 64, 96, 128);
export const DDR = opts("DDR3", "DDR4", "DDR5");
export const SOCKETS = opts("LGA1851", "LGA1700", "LGA1200", "LGA1151", "AM5", "AM4", ["other", "أخرى"]);
