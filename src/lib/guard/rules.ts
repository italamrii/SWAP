/**
 * SWAP Guard — pure detection rules (unit-tested). They spot *patterns* associated with fraud;
 * they never establish identity, ownership, payment or device condition, and the UI must not
 * present them as if they did.
 *
 * Severity:
 *  - info: shown as context only.
 *  - warn: the user is warned and may acknowledge and continue at their discretion.
 *  - high: evidence-backed; the subject goes to moderation and the user cannot bypass it.
 */
import type { GuardSignal } from "@/lib/db/schema";

export type Severity = GuardSignal["severity"];
export type Signal = GuardSignal;

const SITE_HOSTS = ["swap.sa", "www.swap.sa", "localhost"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "rb.gy", "is.gd", "shorturl.at", "ow.ly", "tiny.cc", "s.id", "rebrand.ly", "linktr.ee"];
const CHAT_APPS = ["wa.me", "api.whatsapp.com", "chat.whatsapp.com", "t.me", "telegram.me", "snapchat.com", "instagram.com"];

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9-]+\.)+(?:com|net|org|sa|me|ly|io|co|xyz|top|link|site|online|info|shop|store|app|live)(?:\/[^\s<>"']*)?)/gi;

function hostOf(raw: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function extractLinks(text: string) {
  return [...text.matchAll(URL_RE)].map((m) => ({ raw: m[0], host: hostOf(m[0]) })).filter((l): l is { raw: string; host: string } => !!l.host);
}

/** Link to a shortener, raw IP, punycode lookalike, or with credentials-style "@" — classic phishing shapes. */
export function isSuspiciousLink(raw: string, host: string) {
  return (
    SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`)) ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.split(".").some((p) => p.startsWith("xn--")) ||
    /^https?:\/\/[^/]*@/i.test(raw) ||
    // Impersonation: "swap-support.com", "swapsa-verify.net"…
    (!SITE_HOSTS.includes(host) && /swap[-_.]?(sa|ksa|support|verify|pay|login|help|security)/i.test(host))
  );
}

const normalizeArabic = (t: string) =>
  t
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // harakat + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

/** Requests to pay before seeing the item: deposits, "transfer first", gift cards, money transfer services. */
const DEPOSIT_PATTERNS: RegExp[] = [
  /عربون/,
  /(دفعه|مبلغ|تحويل)\s*(مقدم|مقدما|اولي)/,
  /(حول|حولي|حولو|ادفع|ادفعي)[^.\n]{0,25}(قبل|مقدم|عربون|عشان احجز|للحجز)/,
  /قبل\s*(المعاينه|الاستلام|ما\s*(تشوف|تستلم|تعاين))[^.\n]{0,30}(حول|ادفع|تحويل|دفع)/,
  /(رسوم|تكاليف)\s*(الشحن|التوصيل)[^.\n]{0,20}(مقدم|اول|قبل)/,
  /\b(deposit|advance payment|pay (first|upfront|in advance)|western union|moneygram|gift ?cards?)\b/,
  /(بطاقه|بطاقات)\s*(شحن|ايتونز|قوقل|سوا|بلايستيشن)/,
];

const OFF_PLATFORM_PATTERNS: RegExp[] = [/(واتس|واتساب|وتساب|whats ?app|تلقرام|تيليجرام|telegram|سناب)/];
const PHONE_RE = /(?:\+?966|0)?5\d{8}/;

export function scanText(text: string): Signal[] {
  const out: Signal[] = [];
  const add = (code: string, severity: Severity) => { if (!out.some((s) => s.code === code)) out.push({ code, severity }); };
  const norm = normalizeArabic(text);
  for (const { raw, host } of extractLinks(text)) {
    if (SITE_HOSTS.includes(host)) continue;
    if (isSuspiciousLink(raw, host)) add("suspicious_link", "high");
    else if (CHAT_APPS.some((h) => host === h || host.endsWith(`.${h}`))) add("off_platform_contact", "warn");
    else add("external_link", "warn");
  }
  if (DEPOSIT_PATTERNS.some((re) => re.test(norm))) add("deposit_request", "warn");
  if (PHONE_RE.test(norm.replace(/[\s-]/g, "")) || OFF_PLATFORM_PATTERNS.some((re) => re.test(norm))) add("off_platform_contact", "warn");
  return out;
}

export const maxSeverity = (signals: Signal[]): Severity | null =>
  signals.some((s) => s.severity === "high") ? "high" : signals.some((s) => s.severity === "warn") ? "warn" : signals.length ? "info" : null;

/* ───────────── perceptual image fingerprints ───────────── */

/** Hamming distance between two 64-bit hex fingerprints. */
export function hamming(a: string, b: string) {
  if (a.length !== 16 || b.length !== 16) return 64;
  let d = 0;
  for (let i = 0; i < 16; i += 4) {
    let x = parseInt(a.slice(i, i + 4), 16) ^ parseInt(b.slice(i, i + 4), 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

/** ≤ 6 differing bits of a 64-bit dHash ≈ the same photo after resizing/re-encoding/light edits. */
export const NEAR_DUPLICATE_BITS = 6;
export const isNearDuplicate = (a: string, b: string) => hamming(a, b) <= NEAR_DUPLICATE_BITS;

/** dHash from a 9×8 grayscale pixel buffer (row-major): bit = left pixel brighter than right. */
export function dhashFromPixels(px: Uint8Array | number[]) {
  if (px.length !== 72) throw new Error("dHash needs 9×8 pixels");
  let hex = "";
  let nibble = 0;
  let bits = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      nibble = (nibble << 1) | (px[y * 9 + x] > px[y * 9 + x + 1] ? 1 : 0);
      if (++bits === 4) { hex += nibble.toString(16); nibble = 0; bits = 0; }
    }
  }
  return hex;
}

/* ───────────── text duplicates ───────────── */

export const normalizeListingText = (t: string) => normalizeArabic(t).replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/* ───────────── listing context (for buyers) ───────────── */

export type DealContext = { sellerAccountAgeDays: number; openReports: number; price: number; categoryMedian: number | null; categorySample: number };

/** Non-critical warnings a buyer sees before contacting a seller or making an offer. */
export function dealWarnings(c: DealContext): Signal[] {
  const out: Signal[] = [];
  if (c.sellerAccountAgeDays < 7) out.push({ code: "new_seller", severity: "warn" });
  if (c.openReports >= 2) out.push({ code: "reported_listing", severity: "warn" });
  if (c.categoryMedian && c.categorySample >= 5 && c.price < c.categoryMedian * 0.35) out.push({ code: "price_outlier", severity: "warn" });
  return out;
}

/* ───────────── copy (honest, non-accusatory) ───────────── */

export const SIGNAL_COPY: Record<string, { title: string; advice: string }> = {
  suspicious_link: { title: "رابط مشبوه", advice: "روابط مختصرة أو بعناوين غريبة تُستخدم للتصيّد. لا تُدخل بياناتك أو بيانات بطاقتك في أي رابط." },
  external_link: { title: "رابط خارج سواب", advice: "افتح الروابط الخارجية بحذر، ولا تُدخل كلمات مرور أو بيانات دفع." },
  off_platform_contact: { title: "دعوة للتواصل خارج سواب", advice: "التواصل خارج المنصة يُفقدك سجل المحادثة وإمكانية الإبلاغ. يُفضّل إبقاء التفاوض هنا." },
  deposit_request: { title: "طلب دفع قبل المعاينة", advice: "لا تحوّل عربونًا أو أي مبلغ قبل أن تعاين القطعة وتتأكد منها بنفسك. هذا أشهر أساليب الاحتيال." },
  repeated_deposit: { title: "طلبات دفع مقدم متكررة", advice: "طلب هذا الحساب دفعًا مقدمًا في عدة محادثات. أحلناه للمراجعة." },
  duplicate_broadcast: { title: "رسالة مكررة لعدة أشخاص", advice: "أُرسلت الرسالة نفسها لعدد كبير من المستخدمين." },
  new_seller: { title: "حساب جديد", advice: "أنشئ حساب البائع خلال الأيام الأخيرة. عاين القطعة قبل الدفع واختر مكانًا عامًا." },
  reported_listing: { title: "عليه بلاغات قيد المراجعة", advice: "أبلغ مستخدمون عن هذا الإعلان وفريقنا يراجعه. تعامل بحذر." },
  price_outlier: { title: "سعر أقل بكثير من المعتاد", advice: "السعر أقل بكثير من إعلانات مشابهة. الأسعار غير الواقعية من علامات الاحتيال الشائعة." },
  image_reuse: { title: "صورة مستخدمة في إعلان لحساب آخر", advice: "إحدى الصور تطابق صورة رفعها حساب آخر." },
  copied_text: { title: "وصف منسوخ من إعلان آخر", advice: "الوصف مطابق لإعلان حساب آخر." },
  duplicate_listing: { title: "إعلان مكرر", advice: "لديك إعلان نشط مطابق لهذا الإعلان." },
  new_account_high_value: { title: "حساب جديد وقيمة مرتفعة", advice: "نطلب صورة إثبات حيازة قبل النشر." },
  evidence_reuse: { title: "مرفق فحص مستخدم سابقًا", advice: "أحد مرفقات التقرير يطابق ملفًا رفعه حساب آخر." },
  multiple_reports: { title: "بلاغات متعددة", advice: "تلقّى الإعلان عدة بلاغات احتيال من حسابات موثّقة." },
};

export const signalTitle = (code: string) => SIGNAL_COPY[code]?.title ?? code;
