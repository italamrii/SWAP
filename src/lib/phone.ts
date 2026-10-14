/**
 * Saudi mobile numbers. Accepted inputs: 05XXXXXXXX, +9665XXXXXXXX (also 009665…/9665…),
 * with spaces, dashes, brackets or Arabic-Indic digits. Output is always E.164: +9665XXXXXXXX.
 * Landlines (01x…), short codes and every non-Saudi number are rejected.
 */

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

function toLatinDigits(s: string) {
  return s.replace(ARABIC_DIGITS, (d) => {
    const c = d.charCodeAt(0);
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660);
  });
}

export const SAUDI_MOBILE_E164 = /^\+9665\d{8}$/;

export function normalizeSaudiMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = toLatinDigits(input.trim()).replace(/[\s\-().\u200e\u200f\u202a-\u202e]/g, "");
  if (s.length > 20) return null;
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  else if (s.startsWith("966")) s = `+${s}`;
  else if (s.startsWith("05")) s = `+966${s.slice(1)}`;
  return SAUDI_MOBILE_E164.test(s) ? s : null;
}

export const isSaudiMobile = (e164: string | null | undefined): e164 is string => !!e164 && SAUDI_MOBILE_E164.test(e164);

/** "+966551234567" → "055 123 4567" */
export function formatLocal(e164: string) {
  const local = `0${e164.slice(4)}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** "+966551234567" → "05• ••• 4567" — enough for the owner to recognise, useless to anyone else. */
export function maskPhone(e164: string) {
  return `05• ••• ${e164.slice(-4)}`;
}

/** Explain why an input was rejected, for friendlier form errors. */
export function phoneProblem(input: string): string {
  const s = toLatinDigits(input).replace(/[\s\-().]/g, "");
  if (!s) return "أدخل رقم جوالك";
  if (/^(\+|00)(?!966)/.test(s)) return "التسجيل متاح لأرقام الجوال السعودية فقط (+966)";
  if (/^(\+?966|0)1\d/.test(s)) return "هذا رقم هاتف أرضي. أدخل رقم جوال يبدأ بـ 05";
  return "رقم الجوال غير صحيح. اكتبه بصيغة 05XXXXXXXX";
}
