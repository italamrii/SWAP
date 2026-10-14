/**
 * End-to-end flows against a running SWAP server with freshly seeded data.
 *   pnpm db:reset && pnpm build && pnpm start   (or pnpm dev)
 *   BASE=http://localhost:3100 pnpm test:e2e
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import postgres from "postgres";

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
  await p.goto(`${BASE}/sign-in/email`);
  await p.fill("input[name=email]", email);
  await p.fill("input[name=password]", password);
  await Promise.all([p.waitForURL(/\/account/), p.click("button[type=submit]")]);
  return p;
}

/* Phone auth: the server runs with SMS_PROVIDER=outbox + ALLOW_TEST_SMS=true (local/CI only). */
const OUTBOX = path.resolve(".sms-outbox");
const sql = postgres(process.env.DATABASE_URL ?? "postgres://swap:swap@127.0.0.1:5432/swap", { max: 1, onnotice: () => {} });
const randomMobile = () => `05${Math.floor(1 + Math.random() * 9)}${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;
const e164 = (local) => `+966${local.slice(1)}`;
async function readCode(local, since) {
  const file = path.join(OUTBOX, `${e164(local).slice(1)}.json`);
  for (let i = 0; i < 50; i++) {
    const st = await stat(file).catch(() => null);
    if (st && st.mtimeMs >= since) return JSON.parse(await readFile(file, "utf8")).body.match(/\b(\d{6})\b/)[1];
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`no SMS for ${local}`);
}
/** Simulate the resend cooldown elapsing (the server enforces 60s+ between codes to one number). */
const elapseCooldown = (local) => sql`update phone_otps set created_at = created_at - interval '15 minutes' where phone = ${e164(local)}`;
/** Enter a number, receive the code from the outbox, type it. Returns the page (now navigating). */
async function phoneSignIn(p, local, { path: route = "/sign-in" } = {}) {
  await p.goto(`${BASE}${route}`);
  const since = Date.now() - 50;
  await p.fill("input[name=phone]", local);
  await p.click('button:has-text("أرسل رمز التحقق")');
  await p.locator('[data-step="code"]').waitFor();
  const code = await readCode(local, since);
  await p.fill("input[name=code]", code);
  return code;
}

before(async () => { browser = await chromium.launch(launchOpts); });
after(async () => {
  await sql.end();
  await browser.close();
  assert.deepEqual(pageErrors, [], "no uncaught page errors");
});

describe("public browsing", () => {
  it("home is marketplace-first: listings inside the first desktop viewport", async () => {
    const p = await newPage();
    await p.goto(BASE);
    assert.match(await p.locator("h1").first().innerText(), /سوق الكمبيوتر/);
    assert.ok((await p.locator('[data-testid="listing-card"]').count()) >= 8);
    const top = await p.locator('[data-testid="listing-card"]').first().evaluate((el) => el.getBoundingClientRect().top);
    assert.ok(top < 900, `first listing starts at ${top}px — must be visible without scrolling`);
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

describe("header & navigation drawer", () => {
  it("desktop header has search, city, category bar and post button", async () => {
    const p = await newPage();
    await p.goto(BASE);
    const header = p.locator('[data-testid="site-header"]');
    await header.locator('input[role="combobox"]').waitFor();
    await header.locator('button[aria-label^="المدينة"]').waitFor();
    // The category bar streams in behind a Suspense boundary — wait for it before counting.
    await header.locator('nav[aria-label="الأقسام"] ul a').first().waitFor();
    assert.equal(await header.locator('nav[aria-label="الأقسام"] ul a').count(), 10);
    await header.getByRole("link", { name: "أضف إعلان" }).waitFor();
    const h = await header.evaluate((el) => el.getBoundingClientRect().height);
    assert.ok(h <= 112, `header too tall: ${h}`);
  });
  it("category bar marks the active category", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/browse/gpus`);
    assert.equal(await p.locator('[data-testid="site-header"] a[aria-current="page"]').first().innerText(), "كروت شاشة");
  });
  it("drawer opens, traps focus, highlights the current page and closes with Escape", async () => {
    const p = await newPage(390);
    await p.goto(`${BASE}/browse?verified=1`);
    await p.click('[data-testid="drawer-trigger"]');
    const drawer = p.locator('[data-testid="nav-drawer"]');
    await drawer.waitFor();
    for (const g of ["السوق", "حسابي", "الثقة والدعم", "المنصة"]) await drawer.getByRole("heading", { name: g }).waitFor();
    assert.equal(await drawer.locator('a[aria-current="page"]').first().innerText(), "الإعلانات الموثّقة");
    await p.keyboard.press("Tab");
    assert.ok(await p.evaluate(() => !!document.activeElement?.closest('[data-testid="nav-drawer"]')), "focus stays inside drawer");
    await p.keyboard.press("Escape");
    await drawer.waitFor({ state: "detached" });
    assert.equal(await p.evaluate(() => document.activeElement?.getAttribute("data-testid")), "drawer-trigger");
  });
  it("every drawer link responds without errors", async () => {
    const p = await newPage(390);
    await p.goto(BASE);
    await p.click('[data-testid="drawer-trigger"]');
    const hrefs = await p.locator('[data-testid="nav-drawer"] a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
    assert.ok(hrefs.length >= 20, `only ${hrefs.length} links`);
    for (const h of hrefs) {
      const r = await fetch(BASE + h, { redirect: "manual" });
      assert.ok([200, 307, 308].includes(r.status), `${h} → ${r.status}`);
    }
  });
  it("city selection is applied to search", async () => {
    const p = await newPage();
    await p.goto(BASE);
    await p.locator('[data-testid="site-header"] button[aria-label^="المدينة"]').click();
    await p.locator('[role=option]:has-text("الرياض")').click();
    const input = p.locator('[data-testid="site-header"] input[role="combobox"]');
    await input.fill("RTX");
    await input.press("Enter");
    await p.waitForURL(/\/browse\?q=RTX&city=riyadh/);
  });
  it("browse supports a dense list view that keeps filters", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/browse/gpus?f.mined=no`);
    await p.click('button[aria-label="عرض قائمة"]');
    await p.waitForURL(/view=list/);
    assert.match(p.url(), /f\.mined=no/);
    assert.ok((await p.locator('[data-testid="listing-card"]').count()) > 0);
  });
});

describe("auth & permissions", () => {
  it("phone sign-up rejects invalid and non-Saudi numbers", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/sign-up`);
    for (const [input, msg] of [["12345", "رقم الجوال غير صحيح"], ["+971501234567", "لأرقام الجوال السعودية فقط"], ["0112345678", "رقم هاتف أرضي"]]) {
      await p.fill("input[name=phone]", input);
      await p.click('button:has-text("أرسل رمز التحقق")');
      await p.getByText(msg).waitFor();
      assert.equal(await p.locator('[data-step="phone"]').count(), 1, `${input} must not reach the code step`);
    }
  });
  it("phone sign-up: SMS code → profile → account features", async () => {
    const p = await newPage(390);
    const local = randomMobile();
    const code = await phoneSignIn(p, local, { path: "/sign-up" });
    await p.waitForURL(/\/onboarding/);
    assert.ok(!(await p.content()).includes(code), "the code is never rendered back");
    await p.fill("input[name=username]", `ph_${Date.now() % 100000}`);
    await p.fill("input[name=displayName]", "مختبر الجوال");
    await p.selectOption("select[name=city]", "jeddah");
    await Promise.all([p.waitForURL(/\/account/), p.click("button[type=submit]")]);
    await p.goto(`${BASE}/account/listings/new`);
    assert.equal(new URL(p.url()).pathname, "/account/listings/new", "a verified number unlocks listing");
    await p.goto(`${BASE}/account/settings`);
    assert.equal(await p.getByTestId("verified-phone").innerText(), `05• ••• ${local.slice(-4)}`);
    process.env.E2E_PHONE_USER = local;
  });
  it("the same number signs back in to the same account (one account per number)", async () => {
    const local = process.env.E2E_PHONE_USER;
    const p = await newPage();
    await elapseCooldown(local);
    await phoneSignIn(p, local);
    await p.waitForURL((u) => u.pathname === "/account");
    const [{ n }] = await sql`select count(*)::int as n from users where phone = ${e164(local)}`;
    assert.equal(n, 1);
  });
  it("OTP abuse: resend cooldown, 5 wrong guesses exhaust the code, codes are single-use", async () => {
    const p = await newPage();
    const local = randomMobile();
    await p.goto(`${BASE}/sign-in`);
    const since = Date.now() - 50;
    await p.fill("input[name=phone]", local);
    await p.click('button:has-text("أرسل رمز التحقق")');
    await p.locator('[data-step="code"]').waitFor();
    assert.equal(await p.getByTestId("resend-code").isDisabled(), true, "resend waits for the cooldown");
    const code = await readCode(local, since);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 4; i >= 1; i--) {
      await p.fill("input[name=code]", wrong);
      await p.getByText(`تبقّى ${i}`).waitFor();
    }
    await p.fill("input[name=code]", wrong);
    await p.getByText("استنفدت محاولات هذا الرمز").waitFor();
    await p.fill("input[name=code]", code);
    await p.getByText(/استنفدت محاولات هذا الرمز|انتهت صلاحية الرمز/).waitFor();
    assert.equal(new URL(p.url()).pathname, "/sign-in", "the right code no longer works after exhaustion");
    const [row] = await sql`select code_hash from phone_otps where phone = ${e164(local)} order by created_at desc limit 1`;
    assert.ok(!row.code_hash.includes(code), "only an HMAC of the code is stored");
  });
  it("wrong password is rejected; protected pages redirect", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/sign-in/email`);
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

describe("account eligibility & international browsing", () => {
  it("visitors from anywhere can browse, search, open listings, sellers and safety pages", async () => {
    const headers = { "x-forwarded-for": "8.8.8.8", "accept-language": "en-US" };
    for (const path of ["/", "/browse", "/browse/gpus?q=RTX", "/seller/abdullah_pc", "/safety", "/verification", "/how-it-works"]) {
      const r = await fetch(`${BASE}${path}`, { headers, redirect: "manual" });
      assert.equal(r.status, 200, path);
    }
    const p = await newPage();
    await p.setExtraHTTPHeaders(headers);
    await p.goto(`${BASE}/browse`);
    await Promise.all([p.waitForURL(/\/listing\//), p.click("article a >> nth=0")]);
  });
  it("an email account without a verified number cannot list, message or upload — enforced on the server", async () => {
    const p = await login("demo@swap.example", "Demo@12345");
    await p.getByTestId("verify-phone-banner").waitFor();
    await p.goto(`${BASE}/account/listings/new`);
    await p.waitForURL(/\/account\/verify-phone\?next=%2Faccount%2Flistings%2Fnew/);
    assert.equal(await p.locator("#title").count(), 0, "the listing form is never rendered");
    await p.goto(`${BASE}/browse?q=Odyssey`);
    await p.click("article a >> nth=0");
    await p.click('aside button:has-text("راسل البائع")');
    await p.waitForURL(/\/account\/verify-phone\?next=%2Flisting%2F/);
    const cookie = (await p.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
    const fd = new FormData();
    fd.set("kind", "listing");
    fd.set("file", new Blob([await readFile(PHOTO)], { type: "image/jpeg" }), "x.jpg");
    const r = await fetch(`${BASE}/api/uploads`, { method: "POST", body: fd, headers: { cookie } });
    assert.equal(r.status, 403);
    assert.equal((await r.json()).phoneRequired, true);
  });
  it("a number already used by another active account cannot be claimed; verifying a free number unlocks the account", async () => {
    const p = await login("demo@swap.example", "Demo@12345");
    await p.goto(`${BASE}/account/verify-phone`);
    await p.fill("input[name=phone]", "0500000103"); // a seeded seller's number
    await p.click('button:has-text("أرسل رمز التحقق")');
    await p.getByText("هذا الرقم مرتبط بحساب آخر").waitFor();
    const local = randomMobile();
    const since = Date.now() - 50;
    await p.fill("input[name=phone]", local);
    await p.click('button:has-text("أرسل رمز التحقق")');
    await p.locator('[data-step="code"]').waitFor();
    await p.fill("input[name=code]", await readCode(local, since));
    await p.waitForURL(/\/account\/settings\?phone=verified/);
    await p.goto(`${BASE}/account/listings/new`);
    assert.equal(new URL(p.url()).pathname, "/account/listings/new");
  });
  it("a recycled number (dormant account) opens a fresh account, never the old one", async () => {
    const local = randomMobile();
    const a = await newPage();
    await phoneSignIn(a, local);
    await a.waitForURL(/\/onboarding/);
    const [old] = await sql`update users set last_seen_at = now() - interval '200 days', created_at = now() - interval '400 days' where phone = ${e164(local)} returning id`;
    await elapseCooldown(local);
    const b = await newPage();
    await phoneSignIn(b, local);
    await b.getByTestId("recycled-number").waitFor();
    await Promise.all([b.waitForURL(/\/onboarding/), b.click('button:has-text("أنشئ حسابًا جديدًا")')]);
    const rows = await sql`select id, phone, phone_released_at from users where id = ${old.id} or phone = ${e164(local)}`;
    const oldRow = rows.find((r) => r.id === old.id);
    const newRow = rows.find((r) => r.id !== old.id);
    assert.equal(oldRow.phone, null);
    assert.ok(oldRow.phone_released_at);
    assert.equal(newRow.phone, e164(local));
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

describe("SWAP Guard", () => {
  it("a deposit request with a short link warns the sender; the recipient must acknowledge before replying", async () => {
    const buyer = await login("sarah@swap.example", "Seller@12345");
    await buyer.goto(`${BASE}/browse?q=Legion Pro 5`);
    await buyer.click("article a >> nth=0");
    await buyer.click('aside button:has-text("راسل البائع")');
    await buyer.fill('[role=dialog] textarea', "حوّل عربون 200 ريال قبل المعاينة على هذا الرابط bit.ly/pay-now");
    await buyer.click('[role=dialog] button:has-text("إرسال")');
    await buyer.getByTestId("guard-dialog").waitFor();
    await buyer.getByText("طلب دفع قبل المعاينة").first().waitFor();
    await Promise.all([buyer.waitForURL(/\/account\/messages\//), buyer.click('[data-testid=guard-dialog] button:has-text("فهمت، متابعة")')]);
    const thread = buyer.url();

    const seller = await login("abdullah@swap.example", "Seller@12345");
    await seller.goto(thread);
    await seller.getByTestId("message-guard").first().waitFor();
    assert.equal(await seller.locator('textarea[aria-label="نص الرسالة"]').count(), 0, "composer waits for acknowledgement");
    await seller.getByTestId("guard-ack").click();
    await seller.locator('textarea[aria-label="نص الرسالة"]').waitFor();
    const [flag] = await sql`select signals from guard_flags where subject_type = 'user' and status = 'open' and user_id = (select user_id from profiles where username = 'sarah_z')`;
    assert.ok(flag?.signals.some((x) => x.code === "suspicious_link"), "phishing-shaped link is queued for moderation");
    assert.equal(JSON.stringify(flag.signals).includes("bit.ly"), false, "the audit trail keeps codes, not message text");
  });
  it("a swap offer whose note links off-site asks for acknowledgement, then sends", async () => {
    const p = await login("nawaf@swap.example", "Seller@12345");
    await p.goto(`${BASE}/browse?q=ASUS Dual`);
    await p.click("article a >> nth=0");
    await p.click('aside button:has-text("اقترح بدل")');
    const d = p.locator("[role=dialog]");
    await d.locator('input[placeholder^="مثلًا: RX"]').fill("RX 7900 GRE Sapphire Pulse");
    await d.locator("select").filter({ hasText: "اختر الحالة" }).selectOption("excellent");
    await d.locator("textarea").last().fill("الصور والتفاصيل هنا https://example.com/my-gpu");
    await d.locator('button:has-text("إرسال اقتراح البدل")').click();
    await p.getByTestId("guard-dialog").waitFor();
    await p.getByText("رابط خارج سواب").first().waitFor();
    await Promise.all([p.waitForURL(/\/account\/messages\//), p.click('[data-testid=guard-dialog] button:has-text("فهمت، متابعة")')]);
  });
  it("a listing that reuses another seller's photo is held; possession proof + moderator release it", async () => {
    const s = await login("sarah@swap.example", "Seller@12345");
    await s.goto(`${BASE}/account/listings/new`);
    await s.click('button[role=radio]:has-text("لابتوبات")');
    await s.setInputFiles("input[type=file]", PHOTO);
    await s.getByText("الغلاف").waitFor({ timeout: 20000 });
    await s.selectOption("#spec-brand", "Lenovo");
    await s.fill("#spec-model", "Legion Slim 7");
    await s.fill("#spec-cpu", "i7-13700H");
    await s.selectOption("#spec-ramGb", "16");
    await s.selectOption("#spec-storageGb", "1024");
    await s.fill("#title", "Lenovo Legion Slim 7 نظيف جدًا");
    await s.click('button[role=radio]:has-text("ممتاز")');
    await s.fill("#description", "لابتوب نظيف استخدام خفيف مع الشاحن الأصلي، يشتغل بدون أي مشاكل.");
    await s.fill("#price", "4100");
    await Promise.all([s.waitForURL(/created=guard/), s.click('button:has-text("نشر الإعلان")')]);
    await s.getByTestId("guard-review-link").first().click();
    await s.getByTestId("guard-case").waitFor();
    await s.getByText("صورة مستخدمة في إعلان لحساب آخر").waitFor();
    const code = await s.getByTestId("proof-code").innerText();
    assert.match(code, /^SG-[A-Z0-9]{5}$/);
    await s.setInputFiles('input[aria-label="صورة إثبات الحيازة"]', PHOTO);
    await s.locator('img[alt="معاينة صورة الإثبات"]').waitFor({ timeout: 20000 });
    await s.click('button:has-text("أرسل للمراجعة")');
    await s.getByText("أرسلنا الصورة لفريق المراجعة").waitFor();

    const v = await newPage();
    await v.goto(`${BASE}/browse?q=Legion Slim 7`);
    assert.equal(await v.locator("article").count(), 0, "held listings are not public");

    const mod = await login("mod@swap.example", "Mod@12345");
    await mod.goto(`${BASE}/admin/guard?tab=proofs`);
    await mod.getByText(code).waitFor();
    await mod.getByTestId("proof-approve").first().click();
    await mod.getByText("قُبلت الصورة").waitFor();
    await v.goto(`${BASE}/browse?q=Legion Slim 7`);
    await v.locator("article").first().waitFor();
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
  const pages = ["/", "/browse", "/browse/laptops", "/browse/gpus?view=list", "/help", "/how-it-works", "/verification", "/safety", "/terms", "/sign-in"];
  it("no horizontal overflow at 320–1440px, single h1, rtl document", async () => {
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
    const p = await newPage(width);
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
      assert.ok(m.sw <= m.w + 1, `${path} @${width} overflows: ${m.sw} > ${m.w}`);
      assert.deepEqual(m.clipped, [], `${path} @${width} has content outside the viewport`);
      assert.equal(m.h1, 1, `${path} @${width} should have exactly one h1`);
      assert.equal(m.dir, "rtl");
      assert.equal(m.lang, "ar");
    }
    await p.context().close();
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
