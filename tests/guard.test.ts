import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dealWarnings, dhashFromPixels, extractLinks, hamming, isNearDuplicate, isSuspiciousLink, maxSeverity, normalizeListingText, scanText, SIGNAL_COPY } from "../src/lib/guard/rules";

const codes = (t: string) => scanText(t).map((s) => s.code).sort();

describe("SWAP Guard text signals", () => {
  it("flags deposit / pay-before-viewing requests (Arabic and English)", () => {
    for (const t of ["حوّل عربون 200 ريال وأحجزها لك", "ابي دفعة مقدمة قبل الشحن", "حولي المبلغ قبل المعاينة", "قبل الاستلام لازم تحول نص المبلغ", "Please pay a deposit first", "send it by western union", "ادفع بطاقات شحن ايتونز"]) {
      assert.ok(codes(t).includes("deposit_request"), t);
    }
  });
  it("does not flag ordinary negotiation", () => {
    for (const t of ["السلام عليكم، هل الإعلان متاح؟", "ممكن أعاين القطعة بكرة؟", "وش آخر سعر؟ أقدر أدفع كاش عند الاستلام", "الدفع عند المعاينة في مكان عام"]) {
      assert.deepEqual(codes(t), [], t);
    }
  });
  it("classifies links: phishing shapes are high, chat apps push off-platform, others are external", () => {
    assert.deepEqual(scanText("ادفع هنا bit.ly/3abc"), [{ code: "suspicious_link", severity: "high" }]);
    assert.ok(codes("http://192.168.1.20/pay").includes("suspicious_link"));
    assert.ok(codes("https://xn--swp-qla.com/login").includes("suspicious_link"));
    assert.ok(codes("https://swap-support.com/verify").includes("suspicious_link"));
    assert.ok(codes("https://paypal.com@evil.example/x").includes("suspicious_link"));
    assert.deepEqual(codes("كلمني https://wa.me/966551234567"), ["off_platform_contact"]);
    assert.deepEqual(codes("المواصفات هنا https://www.amazon.sa/dp/B0"), ["external_link"]);
    assert.deepEqual(codes("https://swap.sa/listing/abc"), [], "own domain is fine");
  });
  it("notices phone numbers and messaging apps", () => {
    assert.deepEqual(codes("رقمي 0551234567"), ["off_platform_contact"]);
    assert.deepEqual(codes("كلمني واتساب"), ["off_platform_contact"]);
  });
  it("extracts links and ranks severity", () => {
    assert.deepEqual(extractLinks("see www.example.com and t.co/x").map((l) => l.host), ["www.example.com", "t.co"]);
    assert.equal(isSuspiciousLink("t.co/x", "t.co"), true);
    assert.equal(maxSeverity([{ code: "a", severity: "warn" }, { code: "b", severity: "high" }]), "high");
    assert.equal(maxSeverity([]), null);
  });
  it("has honest copy for every signal and never claims verification", () => {
    for (const [code, c] of Object.entries(SIGNAL_COPY)) {
      assert.ok(c.title && c.advice, code);
      assert.ok(!/(تم التحقق من (هوية|ملكية)|مضمون|موثوق 100)/.test(c.title + c.advice), code);
    }
  });
});

describe("image fingerprints", () => {
  it("computes a 64-bit dHash from a 9×8 grayscale buffer", () => {
    const ramp = Array.from({ length: 72 }, (_, i) => 255 - (i % 9) * 20);
    assert.equal(dhashFromPixels(ramp), "ffffffffffffffff");
    assert.equal(dhashFromPixels(Array.from({ length: 72 }, () => 10)), "0000000000000000");
    assert.throws(() => dhashFromPixels([1, 2, 3]));
  });
  it("measures near-duplicates by Hamming distance", () => {
    assert.equal(hamming("ffffffffffffffff", "ffffffffffffffff"), 0);
    assert.equal(hamming("ffffffffffffffff", "fffffffffffffff0"), 4);
    assert.equal(hamming("0000000000000000", "ffffffffffffffff"), 64);
    assert.equal(isNearDuplicate("abcdef0123456789", "abcdef0123456788"), true);
    assert.equal(isNearDuplicate("abcdef0123456789", "123456789abcdef0"), false);
    assert.equal(hamming("short", "ffffffffffffffff"), 64);
  });
  it("normalizes listing text for duplicate detection", () => {
    assert.equal(normalizeListingText("كرت  شاشة، ممتاز!"), normalizeListingText("كرت شاشة ممتاز"));
    assert.equal(normalizeListingText("إضاءة"), normalizeListingText("اضاءه"));
  });
});

describe("deal warnings for buyers", () => {
  const base = { sellerAccountAgeDays: 400, openReports: 0, price: 500000, categoryMedian: 520000, categorySample: 12 };
  it("is quiet for an established seller at a normal price", () => assert.deepEqual(dealWarnings(base), []));
  it("warns about new sellers, reported listings and unrealistic prices", () => {
    assert.deepEqual(dealWarnings({ ...base, sellerAccountAgeDays: 2 }).map((s) => s.code), ["new_seller"]);
    assert.deepEqual(dealWarnings({ ...base, openReports: 2 }).map((s) => s.code), ["reported_listing"]);
    assert.deepEqual(dealWarnings({ ...base, price: 100000 }).map((s) => s.code), ["price_outlier"]);
  });
  it("needs a meaningful sample before calling a price unrealistic", () => {
    assert.deepEqual(dealWarnings({ ...base, price: 100000, categorySample: 3 }), []);
  });
  it("only ever produces non-critical (acknowledgeable) warnings", () => {
    assert.ok(dealWarnings({ sellerAccountAgeDays: 0, openReports: 9, price: 1, categoryMedian: 1000, categorySample: 50 }).every((s) => s.severity === "warn"));
  });
});
