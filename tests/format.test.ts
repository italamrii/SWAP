import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { arCount, formatSAR, listingsCount, sarToHalalas, timeAgo } from "../src/lib/format";

describe("format", () => {
  it("formats SAR from halalas with Western digits", () => {
    assert.equal(formatSAR(265000), "2,650 ر.س");
    assert.equal(sarToHalalas("12.5"), 1250);
  });
  it("uses correct Arabic count forms", () => {
    assert.equal(listingsCount(0), "لا توجد إعلانات");
    assert.equal(listingsCount(1), "إعلان واحد");
    assert.equal(listingsCount(2), "إعلانان");
    assert.equal(listingsCount(5), "5 إعلانات");
    assert.equal(listingsCount(11), "11 إعلانًا");
    assert.equal(arCount(103, { one: "", two: "", few: "x", many: "y" }), "103 x");
  });
  it("renders relative time in Arabic with Latin digits", () => {
    const now = new Date("2026-10-13T12:00:00Z");
    assert.equal(timeAgo(new Date("2026-10-13T11:59:30Z"), now), "الآن");
    assert.match(timeAgo(new Date("2026-10-13T09:00:00Z"), now), /3/);
  });
});
