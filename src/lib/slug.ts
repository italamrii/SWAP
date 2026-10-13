import { randomBytes } from "node:crypto";

const AR_MAP: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th",
  ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q",
  ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "a", و: "w", ؤ: "o", ي: "y", ى: "a", ئ: "e", ء: "",
};

/** Latin-only, URL-safe slug. Arabic is transliterated so links stay readable when shared. */
export function slugify(input: string, maxLength = 60) {
  const translit = [...input.normalize("NFKD")].map((ch) => AR_MAP[ch] ?? ch).join("");
  return translit
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export function shortId(length = 7) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function listingSlug(title: string) {
  const base = slugify(title) || "listing";
  return `${base}-${shortId()}`;
}
