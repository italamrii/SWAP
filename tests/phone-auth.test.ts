import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DORMANT_DAYS, hasVerifiedSaudiPhone, isDormant, isEligible } from "../src/lib/auth/eligibility";
import { codeMatches, cooldownSeconds, generateCode, hashCode, hashIp, OTP, otpSecret, sendDecision, type SendStats } from "../src/lib/auth/otp-policy";
import { formatLocal, maskPhone, normalizeSaudiMobile, phoneProblem } from "../src/lib/phone";
import { outboxAllowed, smsAvailability, smsDailyCap } from "../src/lib/sms/config";
import { twilioRequest, unifonicRequest } from "../src/lib/sms/requests";

describe("Saudi mobile numbers", () => {
  it("accepts 05XXXXXXXX and +9665XXXXXXXX and normalizes to E.164", () => {
    for (const input of ["0551234567", "+966551234567", "00966551234567", "966551234567", "055 123 4567", "055-123-4567", "(055) 1234567", "٠٥٥١٢٣٤٥٦٧", "‎+966 55 123 4567‎"]) {
      assert.equal(normalizeSaudiMobile(input), "+966551234567", input);
    }
  });
  it("rejects invalid, landline and non-Saudi numbers", () => {
    for (const input of ["", "12345", "055123456", "05512345678", "0112345678", "+966112345678", "+971501234567", "+201001234567", "+15551234567", "9715012345678", "0451234567", "abc0551234567", null, undefined, 551234567]) {
      assert.equal(normalizeSaudiMobile(input as unknown), null, String(input));
    }
  });
  it("explains rejections in Arabic", () => {
    assert.match(phoneProblem("+971501234567"), /السعودية فقط/);
    assert.match(phoneProblem("0112345678"), /أرضي/);
    assert.match(phoneProblem("123"), /غير صحيح/);
    assert.match(phoneProblem(""), /أدخل/);
  });
  it("formats and masks without exposing the full number", () => {
    assert.equal(formatLocal("+966551234567"), "055 123 4567");
    assert.equal(maskPhone("+966551234567"), "05• ••• 4567");
    assert.ok(!maskPhone("+966551234567").includes("55123"));
  });
});

describe("account eligibility", () => {
  const verified = { phone: "+966551234567", phoneVerifiedAt: new Date(), status: "active" as const };
  it("requires an active account with a verified Saudi number", () => {
    assert.equal(isEligible(verified), true);
    assert.equal(isEligible({ ...verified, phoneVerifiedAt: null }), false);
    assert.equal(isEligible({ ...verified, phone: null }), false);
    assert.equal(isEligible({ ...verified, phone: "+971501234567" }), false);
    assert.equal(isEligible({ ...verified, status: "suspended" }), false);
    assert.equal(isEligible(null), false);
    assert.equal(hasVerifiedSaudiPhone({ phone: "+966551234567", phoneVerifiedAt: new Date() }), true);
  });
  it("treats numbers unused for 180+ days as possibly recycled", () => {
    const now = new Date("2026-10-14T00:00:00Z");
    assert.equal(isDormant(new Date(now.getTime() - (DORMANT_DAYS + 1) * 864e5), now), true);
    assert.equal(isDormant(new Date(now.getTime() - 10 * 864e5), now), false);
  });
});

describe("one-time codes", () => {
  it("generates 6-digit codes with leading zeros preserved", () => {
    for (let i = 0; i < 200; i++) assert.match(generateCode(), /^\d{6}$/);
  });
  it("stores only an HMAC bound to the challenge, compared in constant time", () => {
    const secret = "x".repeat(40);
    const h = hashCode(secret, "challenge-a", "123456");
    assert.ok(!h.includes("123456"));
    assert.equal(codeMatches(h, secret, "challenge-a", "123456"), true);
    assert.equal(codeMatches(h, secret, "challenge-a", "123457"), false);
    assert.equal(codeMatches(h, secret, "challenge-b", "123456"), false, "not replayable across challenges");
    assert.equal(codeMatches(h, "y".repeat(40), "challenge-a", "123456"), false);
    assert.equal(codeMatches(h, secret, "challenge-a", "12345"), false);
    assert.equal(codeMatches(h, secret, "challenge-a", "12345a"), false);
  });
  it("hashes IP addresses (never stored raw)", () => {
    const h = hashIp("x".repeat(40), "203.0.113.7");
    assert.ok(!h.includes("203"));
    assert.equal(h.length, 32);
  });
  it("requires a real OTP_SECRET in production", () => {
    assert.throws(() => otpSecret({ NODE_ENV: "production" }));
    assert.throws(() => otpSecret({ NODE_ENV: "production", OTP_SECRET: "short" }));
    assert.equal(otpSecret({ NODE_ENV: "production", OTP_SECRET: "s".repeat(32) }), "s".repeat(32));
    assert.ok(otpSecret({ NODE_ENV: "development" }).length >= 32);
  });
});

describe("OTP abuse limits", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  const base: SendStats = { lastSentAt: null, phoneHour: 0, phoneDay: 0, ipHour: 0, ipDay: 0, exhaustedHour: 0, lastExhaustedAt: null, globalToday: 0 };
  const ago = (s: number) => new Date(now.getTime() - s * 1000);
  it("allows a first code", () => assert.deepEqual(sendDecision(base, 500, now), { ok: true }));
  it("enforces a growing resend cooldown", () => {
    assert.equal(cooldownSeconds(1), 60);
    assert.equal(cooldownSeconds(2), 120);
    assert.equal(cooldownSeconds(3), 240);
    assert.equal(cooldownSeconds(10), OTP.maxCooldownSeconds);
    const d = sendDecision({ ...base, lastSentAt: ago(20), phoneHour: 1, phoneDay: 1 }, 500, now);
    assert.deepEqual(d, { ok: false, reason: "cooldown", retryAfter: 40 });
    assert.deepEqual(sendDecision({ ...base, lastSentAt: ago(61), phoneHour: 1, phoneDay: 1 }, 500, now), { ok: true });
  });
  it("caps codes per number per hour and per day", () => {
    assert.equal((sendDecision({ ...base, lastSentAt: ago(3000), phoneHour: OTP.perPhoneHour, phoneDay: 5 }, 500, now) as { reason: string }).reason, "phone_limit");
    assert.equal((sendDecision({ ...base, lastSentAt: ago(9000), phoneHour: 0, phoneDay: OTP.perPhoneDay }, 500, now) as { reason: string }).reason, "phone_limit");
  });
  it("caps codes per IP (generous for carrier NAT)", () => {
    assert.equal((sendDecision({ ...base, ipHour: OTP.perIpHour }, 500, now) as { reason: string }).reason, "ip_limit");
    assert.equal((sendDecision({ ...base, ipDay: OTP.perIpDay }, 500, now) as { reason: string }).reason, "ip_limit");
    assert.ok(OTP.perIpHour >= 20, "shared Saudi carrier IPs must not lock out whole networks");
  });
  it("locks a number after repeated wrong-guess exhaustion", () => {
    const d = sendDecision({ ...base, exhaustedHour: OTP.lockAfterExhausted, lastExhaustedAt: ago(600) }, 500, now);
    assert.equal((d as { reason: string }).reason, "locked");
    assert.equal((d as { retryAfter: number }).retryAfter, OTP.lockSeconds - 600);
    assert.deepEqual(sendDecision({ ...base, exhaustedHour: OTP.lockAfterExhausted, lastExhaustedAt: ago(OTP.lockSeconds + 1) }, 500, now), { ok: true });
  });
  it("stops at the site-wide daily cost cap", () => {
    assert.equal((sendDecision({ ...base, globalToday: 500 }, 500, now) as { reason: string }).reason, "global_cap");
    assert.equal(smsDailyCap({}), 500);
    assert.equal(smsDailyCap({ SMS_DAILY_CAP: "50" }), 50);
    assert.equal(smsDailyCap({ SMS_DAILY_CAP: "nope" }), 500);
  });
  it("allows at most 5 guesses per code", () => assert.equal(OTP.maxAttempts, 5));
});

describe("SMS delivery configuration", () => {
  const secret = { OTP_SECRET: "k".repeat(40), NODE_ENV: "production" };
  const unifonic = { ...secret, SMS_PROVIDER: "unifonic", UNIFONIC_APP_SID: "app", UNIFONIC_SENDER_ID: "SWAP" };
  it("is unavailable when nothing is configured — no fake success", () => {
    assert.deepEqual(smsAvailability({ NODE_ENV: "production" }), { available: false, reason: "not_configured" });
  });
  it("needs credentials, a production secret and explicit delivery approval", () => {
    assert.equal((smsAvailability({ ...unifonic, UNIFONIC_APP_SID: "" }) as { reason: string }).reason, "missing_credentials");
    assert.equal((smsAvailability({ ...unifonic, OTP_SECRET: "" }) as { reason: string }).reason, "missing_secret");
    assert.equal((smsAvailability(unifonic) as { reason: string }).reason, "delivery_disabled");
    assert.deepEqual(smsAvailability({ ...unifonic, SMS_DELIVERY_ENABLED: "true" }), { available: true, provider: "unifonic" });
    const twilio = { ...secret, SMS_PROVIDER: "twilio", TWILIO_ACCOUNT_SID: "AC1", TWILIO_AUTH_TOKEN: "t", SMS_DELIVERY_ENABLED: "true" };
    assert.equal((smsAvailability(twilio) as { reason: string }).reason, "missing_credentials", "needs a sender or messaging service");
    assert.deepEqual(smsAvailability({ ...twilio, TWILIO_MESSAGING_SERVICE_SID: "MG1" }), { available: true, provider: "twilio" });
    assert.equal((smsAvailability({ ...secret, SMS_PROVIDER: "carrier-pigeon" }) as { reason: string }).reason, "unknown_provider");
  });
  it("never offers the test outbox on Vercel, on a public URL or in the visual preview", () => {
    const local = { SMS_PROVIDER: "outbox", ALLOW_TEST_SMS: "true", APP_URL: "http://localhost:3100" };
    assert.deepEqual(smsAvailability(local), { available: true, provider: "outbox" });
    assert.equal(outboxAllowed({ ...local, VERCEL: "1" }), false);
    assert.equal(outboxAllowed({ ...local, VERCEL_URL: "swap-x.vercel.app" }), false);
    assert.equal(outboxAllowed({ ...local, APP_URL: "https://swap.sa" }), false);
    assert.equal(outboxAllowed({ ...local, ALLOW_TEST_SMS: "false" }), false);
    assert.equal((smsAvailability({ ...local, APP_URL: "https://swap.sa" }) as { reason: string }).reason, "outbox_forbidden");
  });
  it("is always unavailable in the database-free visual preview", () => {
    assert.deepEqual(smsAvailability({ ...unifonic, SMS_DELIVERY_ENABLED: "true", SWAP_VISUAL_PREVIEW: "1", DATABASE_URL: "" }), { available: false, reason: "preview" });
    assert.deepEqual(smsAvailability({ VERCEL: "1", VERCEL_URL: "swap-preview-abc.vercel.app", SMS_PROVIDER: "outbox", ALLOW_TEST_SMS: "true" }), { available: false, reason: "preview" });
  });
  it("builds provider requests as documented (no live call)", () => {
    const u = unifonicRequest({ UNIFONIC_APP_SID: "APP", UNIFONIC_SENDER_ID: "SWAP" }, "+966551234567", "رمز 123456");
    assert.equal(u.url, "https://el.cloud.unifonic.com/rest/SMS/messages");
    assert.equal(u.init.body.get("Recipient"), "966551234567");
    assert.equal(u.init.body.get("AppSid"), "APP");
    assert.equal(u.init.body.get("SenderID"), "SWAP");
    const t = twilioRequest({ TWILIO_ACCOUNT_SID: "AC1", TWILIO_AUTH_TOKEN: "tok", TWILIO_FROM: "+15550001111" }, "+966551234567", "x");
    assert.equal(t.url, "https://api.twilio.com/2010-04-01/Accounts/AC1/Messages.json");
    assert.equal(t.init.body.get("To"), "+966551234567");
    assert.equal(t.init.body.get("From"), "+15550001111");
    assert.equal(t.init.headers.Authorization, `Basic ${Buffer.from("AC1:tok").toString("base64")}`);
  });
});
