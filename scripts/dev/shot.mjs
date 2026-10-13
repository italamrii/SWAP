// Dev utility: screenshot pages. Usage: node scripts/dev/shot.mjs <outDir> <width> <path...> [--login email:pass] [--dark]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");

const [outDir, width, ...rest] = process.argv.slice(2);
const login = rest.find((a) => a.startsWith("--login="))?.slice(8);
const dark = rest.includes("--dark");
const full = !rest.includes("--viewport");
const paths = rest.filter((a) => !a.startsWith("--"));
const base = process.env.BASE ?? "http://localhost:3100";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 1, colorScheme: dark ? "dark" : "light", locale: "ar-SA" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
if (login) {
  const [email, pass] = login.split(":");
  await page.goto(`${base}/sign-in`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pass);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/sign-in")), page.click('button[type="submit"]')]);
}
if (dark) { await page.goto(base + "/"); await page.evaluate(() => localStorage.setItem("theme", "dark")); }
for (const p of paths) {
  await page.goto(base + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const name = p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";
  await page.screenshot({ path: `${outDir}/${name}-${width}${dark ? "-dark" : ""}.png`, fullPage: full });
  console.log("shot", p, page.url());
}
if (errors.length) console.log("ERRORS:\n" + [...new Set(errors)].join("\n"));
await browser.close();
