import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activeFilterCount, parseBrowseParams, toSearchParams } from "../src/lib/browse-params";

describe("parseBrowseParams", () => {
  it("whitelists cities, conditions, sorts and spec filters", () => {
    const f = parseBrowseParams(
      { q: " RTX ", city: "riyadh", condition: "like_new,bogus", sort: "price_asc", "f.vram": "12,999", "f.mined": "no", "f.tempLoad.max": "80", "f.notAField": "x", page: "3" },
      "gpu",
    );
    assert.equal(f.q, "RTX");
    assert.equal(f.city, "riyadh");
    assert.deepEqual(f.conditions, ["like_new"]);
    assert.equal(f.sort, "price_asc");
    assert.deepEqual(f.attrs, { vram: ["12"], mined: ["no"] });
    assert.deepEqual(f.ranges, {}, "tempLoad is not filterable");
    assert.equal(f.page, 3);
  });
  it("falls back safely on garbage input", () => {
    const f = parseBrowseParams({ city: "atlantis", sort: "drop table", page: "-4", min: "abc" });
    assert.equal(f.city, undefined);
    assert.equal(f.sort, "newest");
    assert.equal(f.page, 1);
    assert.equal(f.min, undefined);
  });
  it("parses numeric spec ranges for filterable number fields", () => {
    const f = parseBrowseParams({ "f.batteryHealth.min": "85" }, "laptop");
    assert.deepEqual(f.ranges, { batteryHealth: { min: 85, max: undefined } });
  });
  it("round-trips through toSearchParams and counts active filters", () => {
    const f = parseBrowseParams({ swap: "1", verified: "1", "f.ramGb": "16,32", min: "500" }, "laptop");
    const again = parseBrowseParams(Object.fromEntries(toSearchParams(f)), "laptop");
    assert.deepEqual(again, f);
    assert.equal(activeFilterCount(f), 5);
  });
});
