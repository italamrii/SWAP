import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { CATEGORY_SEED } from "../src/lib/catalog/categories";
import { CATEGORY_BAR, DRAWER_GROUPS, activeNavHref } from "../src/lib/nav";

const APP = path.resolve("src/app");

/** Resolve a URL path to an App Router page file, honoring (groups) and [dynamic] segments. */
function routeExists(urlPath: string): boolean {
  const segments = urlPath.split("/").filter(Boolean);
  const walk = (dir: string, rest: string[]): boolean => {
    const entries = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
    const groups = entries.filter((e) => /^\(.*\)$/.test(e.name));
    if (rest.length === 0) {
      if (existsSync(path.join(dir, "page.tsx"))) return true;
      return groups.some((g) => walk(path.join(dir, g.name), rest));
    }
    const [head, ...tail] = rest;
    const exact = entries.find((e) => e.name === head);
    if (exact && walk(path.join(dir, exact.name), tail)) return true;
    const dyn = entries.find((e) => /^\[[^.].*\]$/.test(e.name));
    if (dyn && walk(path.join(dir, dyn.name), tail)) return true;
    return groups.some((g) => walk(path.join(dir, g.name), rest));
  };
  return walk(APP, segments);
}

describe("navigation config", () => {
  it("every drawer link resolves to a real page", () => {
    for (const g of DRAWER_GROUPS) for (const item of g.items) {
      const p = new URL(item.href, "http://x").pathname;
      assert.ok(routeExists(p), `${item.label} → ${item.href} has no page`);
    }
  });
  it("category bar slugs exist in the taxonomy and resolve", () => {
    const slugs = new Set(CATEGORY_SEED.map((c) => c.slug));
    assert.equal(CATEGORY_BAR.length, 10);
    for (const c of CATEGORY_BAR) {
      assert.ok(slugs.has(c.slug), `unknown category ${c.slug}`);
      assert.ok(routeExists(`/browse/${c.slug}`));
    }
  });
  it("covers the required drawer sections", () => {
    const labels = DRAWER_GROUPS.flatMap((g) => g.items.map((i) => i.label));
    for (const l of ["الرئيسية", "جميع الإعلانات", "إعلانات تقبل البدل", "الإعلانات الموثّقة", "إعلاناتي", "المحادثات", "عروض الأسعار", "عروض البدل", "المفضلة", "الإشعارات", "الفحص والتوثيق", "مركز المساعدة", "الشروط والأحكام", "سياسة الخصوصية"]) {
      assert.ok(labels.includes(l), `missing ${l}`);
    }
  });
  it("highlights the most specific matching item", () => {
    const hrefs = DRAWER_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    const at = (p: string, q = "") => activeNavHref(hrefs, p, new URLSearchParams(q));
    assert.equal(at("/"), "/");
    assert.equal(at("/browse"), "/browse");
    assert.equal(at("/browse", "swap=1"), "/browse?swap=1");
    assert.equal(at("/browse", "verified=1&city=riyadh"), "/browse?verified=1");
    assert.equal(at("/account/messages/abc"), "/account/messages");
    assert.equal(at("/account/offers", "type=swap"), "/account/offers?type=swap");
    assert.equal(at("/account/listings/new"), "/account/listings/new");
    assert.equal(at("/listing/x"), null);
  });
});
