import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATEGORY_SEED } from "../src/lib/catalog/categories";
import { formatSpecValue, specSummary, specValidator, toAttributeRows } from "../src/lib/catalog/helpers";
import { SPEC_SCHEMAS, getSpecSchema } from "../src/lib/catalog/specs";

describe("spec schemas", () => {
  it("every category points to an existing schema", () => {
    for (const c of CATEGORY_SEED) assert.ok(getSpecSchema(c.schemaKey), `missing schema ${c.schemaKey}`);
  });
  it("field keys are unique per schema and selects have options", () => {
    for (const [key, schema] of Object.entries(SPEC_SCHEMAS)) {
      const keys = schema.fields.map((f) => f.key);
      assert.equal(new Set(keys).size, keys.length, `duplicate key in ${key}`);
      for (const f of schema.fields) if (f.type === "select") assert.ok(f.options?.length, `${key}.${f.key} has no options`);
    }
  });
});

describe("specValidator", () => {
  const gpu = specValidator("gpu");
  it("accepts a valid GPU and coerces numbers/booleans", () => {
    const out = gpu.parse({ chipset: "NVIDIA", model: "RTX 4070", vram: "12", mined: "no", tempLoad: "66", boxIncluded: "true", brand: "" });
    assert.deepEqual(out, { chipset: "NVIDIA", model: "RTX 4070", vram: "12", mined: "no", tempLoad: 66, boxIncluded: true });
  });
  it("rejects missing required fields with Arabic messages", () => {
    const r = gpu.safeParse({ chipset: "NVIDIA" });
    assert.equal(r.success, false);
    const fe = r.error!.flatten().fieldErrors as Record<string, string[]>;
    assert.ok(fe.model?.[0].includes("مطلوب"));
    assert.ok(fe.vram);
  });
  it("rejects options outside the schema and out-of-range numbers", () => {
    assert.equal(gpu.safeParse({ chipset: "Apple", model: "x", vram: "12", mined: "no" }).success, false);
    assert.equal(gpu.safeParse({ chipset: "NVIDIA", model: "x", vram: "12", mined: "no", tempLoad: 500 }).success, false);
  });
});

describe("attributes & summaries", () => {
  it("indexes only filterable fields with typed columns", () => {
    const rows = toAttributeRows("laptop", { brand: "ASUS", model: "G14", ramGb: "32", batteryHealth: 91, chargerIncluded: true });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    assert.equal(byKey.model, undefined, "model is not filterable");
    assert.equal(byKey.brand.valueText, "ASUS");
    assert.equal(byKey.ramGb.valueNum, 32);
    assert.equal(byKey.batteryHealth.valueNum, 91);
    assert.equal(byKey.chargerIncluded.valueText, "true");
  });
  it("builds a readable card summary", () => {
    assert.deepEqual(specSummary("gpu", { model: "RTX 4070 Super", vram: "12", mined: "no" }), ["RTX 4070 Super", "12GB", "بدون تعدين"]);
  });
  it("formats values with units", () => {
    const f = getSpecSchema("monitor")!.fields.find((x) => x.key === "refreshRate")!;
    assert.equal(formatSpecValue(f, "240"), "240 Hz");
    const b = getSpecSchema("laptop")!.fields.find((x) => x.key === "batteryHealth")!;
    assert.equal(formatSpecValue(b, 91), "91%");
  });
});
