/** Standard inspection checklist. `schemas` limits an item to relevant categories (omit = all). */
export const CHECKLIST_ITEMS = [
  { key: "powers_on", label: "يعمل ويُقلع بشكل طبيعي" },
  { key: "no_physical_damage", label: "لا توجد كسور أو أضرار جسدية مؤثرة" },
  { key: "display_ok", label: "الشاشة سليمة (بدون بكسلات ميتة أو خطوط)", schemas: ["laptop", "monitor", "console"] },
  { key: "no_artifacts", label: "لا توجد تشوهات رسومية تحت الحمل", schemas: ["gpu", "desktop", "laptop"] },
  { key: "fans_ok", label: "المراوح تعمل بدون أصوات غير طبيعية", schemas: ["gpu", "desktop", "laptop", "psu", "cooling", "console"] },
  { key: "ports_ok", label: "جميع المنافذ تعمل", schemas: ["desktop", "laptop", "motherboard", "monitor", "console", "gpu"] },
  { key: "keyboard_ok", label: "الكيبورد والتاتش باد يعملان بالكامل", schemas: ["laptop"] },
  { key: "battery_ok", label: "البطارية تشحن وتحتفظ بالشحن", schemas: ["laptop"] },
  { key: "wifi_bt_ok", label: "الواي فاي والبلوتوث يعملان", schemas: ["laptop", "desktop", "motherboard"] },
  { key: "storage_healthy", label: "أقراص التخزين بصحة جيدة (SMART)", schemas: ["desktop", "laptop", "storage"] },
  { key: "memtest_passed", label: "اجتاز اختبار الذاكرة", schemas: ["ram", "desktop", "laptop"] },
  { key: "stress_passed", label: "اجتاز اختبار الضغط دون انطفاء أو اختناق حراري", schemas: ["gpu", "cpu", "desktop", "laptop", "psu"] },
  { key: "serial_matches", label: "الرقم التسلسلي مطابق للكرتون/الفاتورة" },
] as const;

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["key"];

export function checklistFor(schemaKey: string) {
  return CHECKLIST_ITEMS.filter((i) => !("schemas" in i) || (i.schemas as readonly string[]).includes(schemaKey));
}

export function checklistLabel(key: string) {
  return CHECKLIST_ITEMS.find((i) => i.key === key)?.label ?? key;
}

/** Which report sections make sense for a category. */
export function reportSections(schemaKey: string) {
  const isSystem = ["desktop", "laptop"].includes(schemaKey);
  return {
    system: isSystem,
    cpu: isSystem || schemaKey === "cpu",
    gpu: isSystem || schemaKey === "gpu",
    motherboard: schemaKey === "desktop" || schemaKey === "motherboard",
    ram: isSystem || schemaKey === "ram",
    storage: isSystem || schemaKey === "storage",
    temps: isSystem || ["gpu", "cpu", "console"].includes(schemaKey),
    battery: schemaKey === "laptop",
    screen: ["laptop", "monitor"].includes(schemaKey),
    ports: ["desktop", "laptop", "motherboard", "monitor", "console"].includes(schemaKey),
    benchmarks: isSystem || ["gpu", "cpu", "storage", "ram"].includes(schemaKey),
  };
}
