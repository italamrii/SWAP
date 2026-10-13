import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checksum, signPayload, verifySignature } from "../src/lib/agent-payload";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { hashToken, newToken } from "../src/lib/auth/tokens";
import { safeNext } from "../src/lib/safe-next";
import { listingSlug, slugify } from "../src/lib/slug";
import { passwordSchema, usernameSchema } from "../src/lib/validation/auth";
import { isTrustedImageUrl } from "../src/lib/validation/listing";

describe("passwords & tokens", () => {
  it("hashes with scrypt and verifies", async () => {
    const h = await hashPassword("Secret123");
    assert.match(h, /^scrypt\$/);
    assert.equal(await verifyPassword("Secret123", h), true);
    assert.equal(await verifyPassword("secret123", h), false);
    assert.notEqual(await hashPassword("Secret123"), h, "salted");
  });
  it("never stores raw session tokens", () => {
    const t = newToken();
    assert.ok(t.length >= 40);
    assert.match(hashToken(t), /^[a-f0-9]{64}$/);
  });
  it("enforces password and username rules", () => {
    assert.equal(passwordSchema.safeParse("short1").success, false);
    assert.equal(passwordSchema.safeParse("onlyletters").success, false);
    assert.equal(passwordSchema.safeParse("Good1234").success, true);
    assert.equal(usernameSchema.safeParse("admin").success, false);
    assert.equal(usernameSchema.safeParse("ab").success, false);
    assert.equal(usernameSchema.safeParse("faisal_builds").success, true);
  });
});

describe("open redirect protection", () => {
  it("only allows same-site relative paths", () => {
    assert.equal(safeNext("/account/offers"), "/account/offers");
    assert.equal(safeNext("//evil.com"), "/");
    assert.equal(safeNext("/\\evil.com"), "/");
    assert.equal(safeNext("https://evil.com"), "/");
    assert.equal(safeNext(undefined, "/x"), "/x");
  });
});

describe("uploads", () => {
  it("accepts only our storage URLs", () => {
    assert.equal(isTrustedImageUrl("/api/files/listings/2026-10/abc.webp"), true);
    assert.equal(isTrustedImageUrl("/seed/gpu-a.svg"), true);
    assert.equal(isTrustedImageUrl("https://evil.example/x.png"), false);
    assert.equal(isTrustedImageUrl("javascript:alert(1)"), false);
  });
});

describe("slugs", () => {
  it("transliterates Arabic and stays URL-safe", () => {
    assert.equal(slugify("كرت RTX 4070 سوبر"), "krt-rtx-4070-swbr");
    assert.match(listingSlug("لابتوب ماك بوك"), /^labtwb-mak-bwk-[a-z2-9]{7}$/);
    assert.match(listingSlug("!!!"), /^listing-/);
  });
});

describe("inspection agent signatures", () => {
  it("verifies HMAC in constant time and rejects tampering", () => {
    const body = JSON.stringify({ a: 1 });
    const sig = signPayload(body, "s3cret");
    assert.equal(verifySignature(body, sig, "s3cret"), true);
    assert.equal(verifySignature(body + " ", sig, "s3cret"), false);
    assert.equal(verifySignature(body, sig, "other"), false);
    assert.equal(verifySignature(body, "nothex", "s3cret"), false);
    assert.match(checksum(body), /^sha256:[a-f0-9]{64}$/);
  });
});
