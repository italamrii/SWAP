/**
 * End-to-end flows against a running SWAP server with freshly seeded data.
 *   pnpm db:reset && pnpm build && pnpm start   (or pnpm dev)
 *   BASE=http://localhost:3100 pnpm test:e2e
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const PHOTO = path.resolve("tests/e2e/fixtures/photo.jpg");
const launchOpts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
let browser;
const pageErrors = [];

async function newPage(width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: "ar-SA" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => pageErrors.push(`${p.url()} :: ${e.message}`));
  return p;
}
async function login(email, password, width) {
  const p = await newPage(width);
  await p.goto(`${BASE}/sign-in`);
  await p.fill("input[name=email]", email);
  await p.fill("input[name=password]", password);
  await Promise.all([p.waitForURL(/\/account/), p.click("button[type=submit]")]);
  return p;
}

before(async () => { browser = await chromium.launch(launchOpts); });
after(async () => {
  await browser.close();
  assert.deepEqual(pageErrors, [], "no uncaught page errors");
});

describe("public browsing", () => {
  it("home renders hero, categories and listings", async () => {
    const p = await newPage();
    await p.goto(BASE);
    assert.match(await p.locator("h1").first().innerText(), /بيع وبدّل/);
    assert.ok((await p.locator("article").count()) >= 8);
  });
  it("category filters narrow results via structured specs", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/browse/gpus`);
    const all = await p.locator("article").count();
    await p.goto(`${BASE}/browse/gpus?f.vram=24`);
    const filtered = await p.locator("article").count();
    assert.ok(filtered > 0 && filtered < all, `filtered ${filtered} of ${all}`);
    await p.goto(`${BASE}/browse/gpus?f.mined=yes`);
    assert.match(await p.locator("article").first().innerText(), /3080/);
    await p.goto(`${BASE}/browse?q=zzzznotfound`);
    await p.getByText("ما لقينا إعلانات").waitFor();
  });
  it("search suggestions API returns matches", async () => {
    const r = await fetch(`${BASE}/api/search/suggest?q=RTX`);
    const j = await r.json();
    assert.ok(j.listings.length > 0);
  });
  it("listing page shows specs, inspection report and JSON-LD", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/browse?q=4070 Super&verified=1`);
    await p.click("article a >> nth=0");
    await p.getByRole("heading", { name: "المواصفات والحالة" }).waitFor();
    await p.getByText("تقرير الفحص").first().waitFor();
    const ld = await p.locator('script[type="application/ld+json"]').first().textContent();
    assert.equal(JSON.parse(ld)["@type"], "Product");
  });
  it("sitemap and robots are served", async () => {
    assert.match(await (await fetch(`${BASE}/sitemap.xml`)).text(), /<urlset/);
    assert.match(await (await fetch(`${BASE}/robots.txt`)).text(), /Disallow: \/admin/);
  });
});

describe("auth & permissions", () => {
  it("sign-up validates, creates the account and onboards", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/sign-up`);
    await p.click("button[type=submit]");
    await p.getByText("صيغة البريد الإلكتروني غير صحيحة").waitFor();
    const email = `e2e+${Date.now()}@example.com`;
    await p.fill("input[name=displayName]", "مختبر سواب");
    await p.fill("input[name=email]", email);
    await p.fill("input[name=password]", "Testing123");
    await p.click('button[role=checkbox]');
    await Promise.all([p.waitForURL(/\/onboarding/), p.click("button[type=submit]")]);
    await p.fill("input[name=username]", `e2e_${Date.now() % 100000}`);
    await p.selectOption("select[name=city]", "jeddah");
    await Promise.all([p.waitForURL(/\/account\?welcome=1/), p.click("button[type=submit]")]);
  });
  it("wrong password is rejected; protected pages redirect", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/sign-in`);
    await p.fill("input[name=email]", "demo@swap.example");
    await p.fill("input[name=password]", "wrong-pass1");
    await p.click("button[type=submit]");
    await p.getByText("البريد الإلكتروني أو كلمة المرور غير صحيحة").waitFor();
    await p.goto(`${BASE}/account/messages`);
    assert.match(p.url(), /\/sign-in\?next=%2Faccount%2Fmessages/);
  });
  it("non-staff cannot reach admin; moderator cannot reach admin-only pages", async () => {
    const demo = await login("demo@swap.example", "Demo@12345");
    await demo.goto(`${BASE}/admin`);
    assert.equal(new URL(demo.url()).pathname, "/");
    const mod = await login("mod@swap.example", "Mod@12345");
    await mod.goto(`${BASE}/admin/categories`);
    await mod.waitForURL((u) => u.pathname === "/admin");
    assert.equal(await mod.getByText("تعديل الأقسام").count(), 0);
  });
  it("uploads require authentication", async () => {
    const r = await fetch(`${BASE}/api/uploads`, { method: "POST", body: new FormData() });
    assert.equal(r.status, 401);
  });
});

describe("selling, offers and swaps", () => {
  it("creates a listing with photo and structured specs", async () => {
    const p = await login("abdullah@swap.example", "Seller@12345");
    await p.goto(`${BASE}/account/listings/new`);
    await p.click('button[role=radio]:has-text("لابتوبات")');
    await p.setInputFiles("input[type=file]", PHOTO);
    await p.getByText("الغلاف").waitFor({ timeout: 20000 });
    await p.selectOption("#spec-brand", "Lenovo");
    await p.fill("#spec-model", "Legion Pro 5 Gen 8");
    await p.fill("#spec-cpu", "i7-13700HX");
    await p.selectOption("#spec-ramGb", "32");
    await p.selectOption("#spec-storageGb", "1024");
    await p.fill("#title", "Lenovo Legion Pro 5 — RTX 4070 بحالة ممتازة");
    await p.click('button[role=radio]:has-text("ممتاز")');
    await p.fill("#description", "لابتوب قيمنق استخدام سنة، البطارية ممتازة ومعه الشاحن الأصلي والكرتون.");
    await p.fill("#price", "5200");
    await Promise.all([p.waitForURL(/created=active/), p.click('button:has-text("نشر الإعلان")')]);
    await p.goto(`${BASE}/browse/laptops?f.brand=Lenovo&f.ramGb=32`);
    await p.getByText("Legion Pro 5").first().waitFor();
  });
  it("buyer sends a price offer; seller accepts; buyer sees it", async () => {
    const buyer = await login("sarah@swap.example", "Seller@12345");
    await buyer.goto(`${BASE}/browse?q=Legion Pro 5`);
    await buyer.click("article a >> nth=0");
    await buyer.click('aside button:has-text("قدّم عرض سعر")');
    await buyer.fill("#offer-amount", "4900");
    await Promise.all([buyer.waitForURL(/\/account\/messages\//), buyer.click('[role=dialog] button:has-text("إرسال العرض")')]);
    const thread = buyer.url();
    const seller = await login("abdullah@swap.example", "Seller@12345");
    await seller.goto(`${BASE}/account/offers`);
    await seller.locator('li:has-text("Legion Pro 5") button:has-text("قبول")').click();
    await seller.getByText("قبلت العرض").waitFor();
    await buyer.goto(thread);
    await buyer.getByText("قبل البائع").first().waitFor();
  });
  it("swap offer is blocked on listings that don't accept swaps", async () => {
    const p = await login("sarah@swap.example", "Seller@12345");
    await p.goto(`${BASE}/browse?q=Legion Pro 5`);
    await p.click("article a >> nth=0");
    assert.equal(await p.locator('aside button:has-text("اقترح بدل")').count(), 0);
  });
});

describe("inspection & verification", () => {
  it("seller submits a report with evidence; moderator approves; badge appears", async () => {
    const s = await login("abdullah@swap.example", "Seller@12345");
    await s.goto(`${BASE}/account/verification`);
    await s.locator('li:has-text("Legion Pro 5") button:has-text("ابدأ التوثيق")').click();
    await s.waitForURL(/\/account\/verification\/[0-9a-f-]{36}/);
    const code = (await s.locator('button[aria-label="نسخ كود التحقق"] span').first().innerText()).trim();
    assert.match(code, /^SW-[A-Z0-9]{4}$/);
    await s.setInputFiles('input[type=file][accept="image/*,application/pdf"]', PHOTO);
    await s.locator('input[aria-label="وصف المرفق"]').waitFor({ timeout: 20000 });
    for (const label of ["يعمل ويُقلع بشكل طبيعي", "البطارية تشحن وتحتفظ بالشحن", "الكيبورد والتاتش باد يعملان بالكامل"]) {
      await s.locator(`li:has-text("${label}") button[role=radio]:has-text("نعم")`).click();
    }
    await s.click('label:has-text("أقر بأن البيانات")');
    await Promise.all([s.waitForURL(/submitted=1/), s.click('button:has-text("إرسال للمراجعة")')]);

    const mod = await login("mod@swap.example", "Mod@12345");
    await mod.goto(`${BASE}/admin/inspections`);
    await mod.click('a:has-text("Legion Pro 5")');
    await mod.getByText(code).first().waitFor();
    await mod.click('button:has-text("اعتماد التقرير")');
    await mod.getByText("اعتُمد التقرير").waitFor();

    const v = await newPage();
    await v.goto(`${BASE}/browse/laptops?verified=1`);
    await v.getByText("Legion Pro 5").first().waitFor();
  });
  it("agent endpoint is disabled unless configured", async () => {
    const r = await fetch(`${BASE}/api/inspections/agent`, { method: "POST", body: "{}" });
    assert.equal(r.status, 503);
  });
});

describe("responsive & accessibility smoke", () => {
  const pages = ["/", "/browse", "/browse/laptops", "/how-it-works", "/verification", "/safety", "/terms", "/sign-in"];
  it("no horizontal overflow at 375px, single h1, rtl document", async () => {
    const p = await newPage(375);
    for (const path of pages) {
      await p.goto(BASE + path);
      const m = await p.evaluate(() => {
        // Content clipped by an overflow-hidden ancestor still counts — only real scroll containers are exempt.
        const inScroller = (el) => { for (let a = el.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "scroll") return true; } return false; };
        const clipped = [...document.querySelectorAll("main h1, main h2, main p, main form, main a, main button")]
          .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -2 || r.right > innerWidth + 2) && !inScroller(el) && getComputedStyle(el).position !== "absolute"; })
          .map((el) => el.tagName + ":" + (el.textContent ?? "").trim().slice(0, 30));
        return { sw: document.documentElement.scrollWidth, w: innerWidth, h1: document.querySelectorAll("h1").length, dir: document.documentElement.dir, lang: document.documentElement.lang, clipped };
      });
      assert.ok(m.sw <= m.w + 1, `${path} overflows: ${m.sw} > ${m.w}`);
      assert.deepEqual(m.clipped, [], `${path} has content outside the viewport`);
      assert.equal(m.h1, 1, `${path} should have exactly one h1`);
      assert.equal(m.dir, "rtl");
      assert.equal(m.lang, "ar");
    }
  });
  it("account pages fit on mobile", async () => {
    const p = await login("demo@swap.example", "Demo@12345", 375);
    for (const path of ["/account", "/account/listings", "/account/messages", "/account/offers", "/account/favorites", "/account/settings", "/account/verification"]) {
      await p.goto(BASE + path);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(sw <= 376, `${path} overflows: ${sw}`);
    }
  });
  it("images have alt text and form fields have labels on key pages", async () => {
    const p = await newPage();
    for (const path of ["/", "/browse/gpus", "/sign-up"]) {
      await p.goto(BASE + path);
      const bad = await p.evaluate(() => ({
        imgs: [...document.querySelectorAll("img:not([alt])")].length,
        inputs: [...document.querySelectorAll("input:not([type=hidden]):not([tabindex='-1']), select, textarea")].filter((el) => {
          const id = el.id;
          return !(el.getAttribute("aria-label") || (id && document.querySelector(`label[for="${id}"]`)) || el.closest("label") || el.getAttribute("aria-labelledby"));
        }).map((el) => el.outerHTML.slice(0, 80)),
      }));
      assert.equal(bad.imgs, 0, `${path} images without alt`);
      assert.deepEqual(bad.inputs, [], `${path} unlabeled inputs`);
    }
  });
});
