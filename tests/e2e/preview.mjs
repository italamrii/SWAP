/**
 * Visual-preview flows: a production build with NO database and SWAP_VISUAL_PREVIEW=1.
 *   SWAP_VISUAL_PREVIEW=1 pnpm build && SWAP_VISUAL_PREVIEW=1 pnpm start
 *   BASE=http://localhost:3100 pnpm test:e2e:preview
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const launchOpts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
let browser;
const pageErrors = [];

async function open(path, width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: "ar-SA" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => pageErrors.push(`${path} :: ${e.message}`));
  const res = await p.goto(BASE + path);
  return { p, status: res?.status() };
}

before(async () => { browser = await chromium.launch(launchOpts); });
after(async () => {
  await browser.close();
  assert.deepEqual(pageErrors, [], "no uncaught page errors");
});

describe("visual preview (no database)", () => {
  it("every public page renders with the preview label", async () => {
    for (const path of ["/", "/browse", "/browse/gpus", "/browse/laptops?view=list", "/help", "/verification", "/how-it-works", "/safety", "/about", "/terms", "/privacy", "/contact"]) {
      const { p, status } = await open(path);
      assert.equal(status, 200, `${path} → ${status}`);
      await p.locator('[data-testid="preview-banner"]').waitFor();
      assert.equal(await p.locator("h1").count(), 1, `${path} single h1`);
      await p.context().close();
    }
  });
  it("home shows sample listings in the first viewport, using the shared card", async () => {
    const { p } = await open("/");
    const cards = p.locator('[data-testid="listing-card"]');
    assert.ok((await cards.count()) >= 8);
    assert.ok((await cards.first().evaluate((el) => el.getBoundingClientRect().top)) < 900);
    await p.getByText("أرقام نموذجية").waitFor();
    assert.equal(await p.getByRole("button", { name: /حفظ في المفضلة/ }).count(), 0, "favorites disabled");
  });
  it("spec filters work on sample data and URLs stay shareable", async () => {
    const { p } = await open("/browse/gpus");
    const all = await p.locator('[data-testid="listing-card"]').count();
    await p.goto(`${BASE}/browse/gpus?f.vram=24`);
    const filtered = await p.locator('[data-testid="listing-card"]').count();
    assert.ok(filtered > 0 && filtered < all, `${filtered}/${all}`);
  });
  it("listing detail uses the real layout with transactions disabled", async () => {
    const { p } = await open("/browse?verified=1");
    await p.locator('[data-testid="listing-card"] a').first().click();
    await p.waitForURL(/\/listing\/sample-/);
    await p.getByRole("heading", { name: "المواصفات والحالة" }).waitFor();
    await p.locator('[data-testid="preview-actions"]').waitFor();
    await p.getByText("تقرير نموذجي لعرض التصميم فقط").waitFor();
    assert.equal(await p.getByRole("button", { name: "راسل البائع" }).count(), 0, "no live message action");
    assert.equal(await p.locator('script[type="application/ld+json"]').count(), 0, "no Product SEO for sample data");
  });
  it("seller profiles render as labeled samples", async () => {
    const { p, status } = await open("/seller/abdullah_pc");
    assert.equal(status, 200);
    await p.getByText("ملف بائع نموذجي").waitFor();
  });
  it("auth and account areas are disabled, not broken", async () => {
    const { p } = await open("/account/messages");
    await p.waitForURL(/\/sign-in/);
    await p.locator('[data-testid="preview-auth-disabled"]').waitFor();
    assert.equal(await p.locator('input[name="password"]').count(), 0);
  });
  it("drawer works and hides account actions", async () => {
    const { p } = await open("/", 390);
    await p.click('[data-testid="drawer-trigger"]');
    const d = p.locator('[data-testid="nav-drawer"]');
    await d.getByText("غير متاح في المعاينة").waitFor();
    assert.equal(await d.getByRole("link", { name: "إعلاناتي" }).count(), 0);
  });
  it("is never indexed", async () => {
    assert.match(await (await fetch(`${BASE}/robots.txt`)).text(), /Disallow: \//);
    assert.doesNotMatch(await (await fetch(`${BASE}/sitemap.xml`)).text(), /<loc>/);
  });
  it("search suggestions use sample data", async () => {
    const j = await (await fetch(`${BASE}/api/search/suggest?q=RTX`)).json();
    assert.ok(j.listings.length > 0);
  });
});
