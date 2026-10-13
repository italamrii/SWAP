const sarFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** halalas → "4,250" */
export function formatAmount(halalas: number) {
  return sarFormatter.format(Math.round(halalas / 100));
}

/** halalas → "4,250 ر.س" */
export function formatSAR(halalas: number) {
  return `${formatAmount(halalas)} ر.س`;
}

export function sarToHalalas(sar: number | string) {
  return Math.round(Number(sar) * 100);
}

const rtf = new Intl.RelativeTimeFormat("ar-SA-u-nu-latn", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function timeAgo(date: Date | string | null | undefined, now: Date = new Date()) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((d.getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "الآن";
}

const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { hour: "numeric", minute: "2-digit" });
const monthYearFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { month: "long", year: "numeric" });

export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));
export const formatDateTime = (d: Date | string) => dateTimeFmt.format(new Date(d));
export const formatTime = (d: Date | string) => timeFmt.format(new Date(d));
export const formatMonthYear = (d: Date | string) => monthYearFmt.format(new Date(d));

/** Arabic count phrases: 0 → "لا يوجد", 1 → "إعلان واحد", 2 → "إعلانان", 3-10 → "3 إعلانات", 11+ → "11 إعلانًا" */
export function arCount(n: number, forms: { one: string; two: string; few: string; many: string; zero?: string }) {
  if (n === 0) return forms.zero ?? `0 ${forms.few}`;
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const mod = n % 100;
  if (mod >= 3 && mod <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

export const listingsCount = (n: number) =>
  arCount(n, { zero: "لا توجد إعلانات", one: "إعلان واحد", two: "إعلانان", few: "إعلانات", many: "إعلانًا" });

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function daysSince(d: Date | string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
}
