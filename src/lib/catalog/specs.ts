import { AGE, DDR, RAM_SIZES, SOCKETS, WARRANTY, gbOpts, opts } from "./options";
import type { SpecSchema } from "./types";

/**
 * Category spec schemas — the single source of truth for listing forms,
 * spec tables, card summaries, browse filters and attribute indexing.
 * Keys are stable identifiers stored in the DB; never rename a key in place.
 */

const desktop: SpecSchema = {
  key: "desktop",
  fields: [
    { key: "cpu", label: "المعالج", labelEn: "CPU", type: "text", ltr: true, required: true, highlight: true, placeholder: "Ryzen 7 7800X3D", group: "core" },
    { key: "cpuBrand", label: "نوع المعالج", labelEn: "CPU brand", type: "select", options: opts("Intel", "AMD", "Apple"), filterable: true, group: "core" },
    { key: "gpu", label: "كرت الشاشة", labelEn: "GPU", type: "text", ltr: true, required: true, highlight: true, placeholder: "RTX 4070 Super 12GB", group: "core" },
    { key: "gpuBrand", label: "نوع كرت الشاشة", labelEn: "GPU brand", type: "select", options: opts("NVIDIA", "AMD", "Intel", ["integrated", "مدمج"]), filterable: true, group: "core" },
    { key: "motherboard", label: "اللوحة الأم", labelEn: "Motherboard", type: "text", ltr: true, placeholder: "MSI B650 Tomahawk WiFi", group: "core" },
    { key: "ramGb", label: "الرام", labelEn: "RAM", type: "select", options: RAM_SIZES, required: true, filterable: true, highlight: true, group: "core" },
    { key: "ramType", label: "نوع الرام", labelEn: "RAM type", type: "select", options: DDR, filterable: true, group: "core" },
    { key: "ramSpeed", label: "سرعة الرام", labelEn: "RAM speed", type: "number", unit: "MHz", min: 800, max: 12000, group: "core" },
    { key: "storage", label: "التخزين", labelEn: "Storage", type: "text", ltr: true, placeholder: "1TB NVMe + 2TB HDD", group: "core" },
    { key: "storageType", label: "نوع التخزين الأساسي", labelEn: "Primary storage", type: "select", options: opts("NVMe", "SATA SSD", "HDD"), filterable: true, group: "core" },
    { key: "psuWatt", label: "مزود الطاقة", labelEn: "PSU", type: "number", unit: "W", min: 200, max: 2000, group: "core" },
    { key: "cooling", label: "التبريد", labelEn: "Cooling", type: "select", options: opts(["air", "هوائي"], ["aio", "مائي AIO"], ["custom", "مائي مخصص"], ["stock", "مبرد أصلي"]), group: "core" },
    { key: "case", label: "الكيس", labelEn: "Case", type: "text", ltr: true, placeholder: "Lian Li O11 Dynamic", group: "core" },
    { key: "os", label: "نظام التشغيل", labelEn: "OS", type: "select", options: opts("Windows 11", "Windows 10", "Linux", "macOS", ["none", "بدون نظام"]), group: "extras" },
    { key: "usage", label: "الاستخدام السابق", labelEn: "Usage", type: "select", options: opts(["gaming", "ألعاب"], ["creative", "تصميم ومونتاج"], ["office", "مكتبي"], ["mixed", "متنوع"]), group: "condition" },
    { key: "age", label: "عمر الجهاز", labelEn: "Age", type: "select", options: AGE, group: "condition" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, filterable: true, group: "condition" },
  ],
};

const laptop: SpecSchema = {
  key: "laptop",
  fields: [
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "select", required: true, filterable: true, options: opts("Apple", "ASUS", "Lenovo", "Dell", "HP", "MSI", "Acer", "Razer", "Microsoft", "Samsung", "Huawei", "Gigabyte", ["other", "أخرى"]), group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, required: true, highlight: true, placeholder: "ROG Zephyrus G14 2024", group: "core" },
    { key: "cpu", label: "المعالج", labelEn: "CPU", type: "text", ltr: true, required: true, placeholder: "Ryzen 9 8945HS", group: "core" },
    { key: "gpu", label: "كرت الشاشة", labelEn: "GPU", type: "text", ltr: true, highlight: true, placeholder: "RTX 4060 8GB", group: "core" },
    { key: "ramGb", label: "الرام", labelEn: "RAM", type: "select", options: RAM_SIZES, required: true, filterable: true, highlight: true, group: "core" },
    { key: "storageGb", label: "التخزين", labelEn: "Storage", type: "select", options: gbOpts(128, 256, 512, 1024, 2048, 4096), required: true, filterable: true, highlight: true, group: "core" },
    { key: "screenSize", label: "حجم الشاشة", labelEn: "Screen size", type: "select", unit: "″", options: opts("13", "13.3", "14", "15.6", "16", "17.3", "18"), filterable: true, group: "core" },
    { key: "refreshRate", label: "معدل التحديث", labelEn: "Refresh rate", type: "select", unit: "Hz", options: opts("60", "90", "120", "144", "165", "240", "300"), filterable: true, group: "core" },
    { key: "batteryHealth", label: "صحة البطارية", labelEn: "Battery health", type: "number", unit: "%", min: 0, max: 100, filterable: true, hint: "تجدها في إعدادات البطارية أو عبر أداة فحص", group: "condition" },
    { key: "batteryCycles", label: "دورات الشحن", labelEn: "Cycle count", type: "number", min: 0, max: 5000, group: "condition" },
    { key: "keyboard", label: "لغة الكيبورد", labelEn: "Keyboard", type: "select", options: opts(["ar-en", "عربي / إنجليزي"], ["en", "إنجليزي فقط"]), group: "extras" },
    { key: "chargerIncluded", label: "الشاحن الأصلي مرفق", labelEn: "Charger included", type: "boolean", filterable: true, group: "extras" },
    { key: "boxIncluded", label: "الكرتون متوفر", labelEn: "Box included", type: "boolean", group: "extras" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, filterable: true, group: "condition" },
  ],
};

const gpu: SpecSchema = {
  key: "gpu",
  fields: [
    { key: "chipset", label: "الشركة المصنعة للمعالج", labelEn: "Chipset", type: "select", required: true, filterable: true, options: opts("NVIDIA", "AMD", "Intel"), group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, required: true, highlight: true, placeholder: "RTX 4070 Super", group: "core" },
    { key: "brand", label: "الشركة", labelEn: "Board partner", type: "select", filterable: true, options: opts("ASUS", "MSI", "Gigabyte", "Zotac", "Sapphire", "PowerColor", "XFX", "Palit", "Gainward", "PNY", "Inno3D", "EVGA", ["fe", "Founders Edition"], ["other", "أخرى"]), group: "core" },
    { key: "vram", label: "الذاكرة", labelEn: "VRAM", type: "select", required: true, filterable: true, highlight: true, options: gbOpts(4, 6, 8, 10, 12, 16, 20, 24, 32), group: "core" },
    { key: "mined", label: "استُخدم في التعدين", labelEn: "Used for mining", type: "tristate", required: true, filterable: true, highlight: true, group: "condition" },
    { key: "repaired", label: "سبق فكّه أو صيانته", labelEn: "Opened / repaired", type: "tristate", group: "condition" },
    { key: "tempIdle", label: "الحرارة بدون حمل", labelEn: "Idle temp", type: "number", unit: "°C", min: 15, max: 110, group: "condition" },
    { key: "tempLoad", label: "الحرارة تحت الحمل", labelEn: "Load temp", type: "number", unit: "°C", min: 20, max: 120, group: "condition" },
    { key: "boxIncluded", label: "الكرتون متوفر", labelEn: "Box included", type: "boolean", filterable: true, group: "extras" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, filterable: true, group: "condition" },
  ],
};

const cpu: SpecSchema = {
  key: "cpu",
  fields: [
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "select", required: true, filterable: true, options: opts("Intel", "AMD"), group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, required: true, highlight: true, placeholder: "Core i7-14700K", group: "core" },
    { key: "generation", label: "الجيل", labelEn: "Generation", type: "text", placeholder: "الجيل 14 / Ryzen 7000", group: "core" },
    { key: "socket", label: "السوكت", labelEn: "Socket", type: "select", required: true, filterable: true, highlight: true, options: SOCKETS, group: "core" },
    { key: "cores", label: "الأنوية / المسارات", labelEn: "Cores / threads", type: "text", ltr: true, placeholder: "20C / 28T", group: "core" },
    { key: "coolerIncluded", label: "المبرد الأصلي مرفق", labelEn: "Stock cooler", type: "boolean", filterable: true, group: "extras" },
    { key: "overclocked", label: "سبق عمل أوفركلوك", labelEn: "Overclocked", type: "tristate", filterable: true, group: "condition" },
    { key: "boxIncluded", label: "الكرتون متوفر", labelEn: "Box included", type: "boolean", group: "extras" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, group: "condition" },
  ],
};

const motherboard: SpecSchema = {
  key: "motherboard",
  fields: [
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "select", required: true, filterable: true, options: opts("ASUS", "MSI", "Gigabyte", "ASRock", "Biostar", ["other", "أخرى"]), group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, required: true, highlight: true, placeholder: "ROG Strix B650E-F", group: "core" },
    { key: "chipset", label: "الشريحة", labelEn: "Chipset", type: "text", ltr: true, highlight: true, placeholder: "B650E", group: "core" },
    { key: "socket", label: "السوكت", labelEn: "Socket", type: "select", required: true, filterable: true, options: SOCKETS, group: "core" },
    { key: "formFactor", label: "المقاس", labelEn: "Form factor", type: "select", filterable: true, options: opts("ATX", "Micro-ATX", "Mini-ITX", "E-ATX"), group: "core" },
    { key: "ramType", label: "نوع الرام المدعوم", labelEn: "Memory", type: "select", filterable: true, options: DDR, group: "core" },
    { key: "wifi", label: "واي فاي مدمج", labelEn: "Wi-Fi", type: "boolean", filterable: true, group: "extras" },
    { key: "pins", label: "حالة الدبابيس", labelEn: "Socket pins", type: "select", options: opts(["perfect", "سليمة تمامًا"], ["fixed", "تم إصلاح دبوس"], ["damaged", "بها ضرر"]), group: "condition" },
    { key: "boxIncluded", label: "الكرتون والملحقات", labelEn: "Box & accessories", type: "boolean", group: "extras" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, group: "condition" },
  ],
};

const ram: SpecSchema = {
  key: "ram",
  fields: [
    { key: "ddr", label: "الجيل", labelEn: "Generation", type: "select", required: true, filterable: true, highlight: true, options: DDR, group: "core" },
    { key: "capacityGb", label: "السعة الإجمالية", labelEn: "Total capacity", type: "select", required: true, filterable: true, highlight: true, options: RAM_SIZES, group: "core" },
    { key: "speed", label: "السرعة", labelEn: "Speed", type: "number", unit: "MHz", required: true, filterable: true, highlight: true, min: 800, max: 12000, group: "core" },
    { key: "kit", label: "نوع الطقم", labelEn: "Kit", type: "select", options: opts(["1x", "شريحة واحدة"], ["2x", "شريحتين"], ["4x", "4 شرائح"]), group: "core" },
    { key: "formFactor", label: "النوع", labelEn: "Form factor", type: "select", filterable: true, options: opts(["dimm", "مكتبي DIMM"], ["sodimm", "لابتوب SO-DIMM"]), group: "core" },
    { key: "timings", label: "التوقيتات", labelEn: "Timings", type: "text", ltr: true, placeholder: "CL30-36-36-76", group: "core" },
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "text", ltr: true, placeholder: "G.Skill Trident Z5", group: "core" },
    { key: "rgb", label: "إضاءة RGB", labelEn: "RGB", type: "boolean", filterable: true, group: "extras" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, group: "condition" },
  ],
};

const storage: SpecSchema = {
  key: "storage",
  fields: [
    { key: "type", label: "النوع", labelEn: "Type", type: "select", required: true, filterable: true, highlight: true, options: opts(["nvme", "NVMe M.2"], ["sata-ssd", "SATA SSD"], ["hdd", "HDD"], ["external", "خارجي"]), group: "core" },
    { key: "capacityGb", label: "السعة", labelEn: "Capacity", type: "select", required: true, filterable: true, highlight: true, options: gbOpts(128, 256, 512, 1024, 2048, 4096, 8192, 16384), group: "core" },
    { key: "healthPct", label: "صحة القرص", labelEn: "Health", type: "number", unit: "%", min: 0, max: 100, filterable: true, highlight: true, hint: "من CrystalDiskInfo أو أداة الشركة", group: "condition" },
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "text", ltr: true, placeholder: "Samsung", group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, placeholder: "990 Pro", group: "core" },
    { key: "pcieGen", label: "جيل PCIe", labelEn: "PCIe gen", type: "select", options: opts("Gen3", "Gen4", "Gen5"), group: "core" },
    { key: "written", label: "إجمالي البيانات المكتوبة", labelEn: "Host writes", type: "number", unit: "TB", min: 0, max: 100000, group: "condition" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, group: "condition" },
  ],
};

const psu: SpecSchema = {
  key: "psu",
  fields: [
    { key: "wattage", label: "القدرة", labelEn: "Wattage", type: "number", unit: "W", required: true, filterable: true, highlight: true, min: 200, max: 2000, group: "core" },
    { key: "rating", label: "شهادة الكفاءة", labelEn: "Efficiency", type: "select", filterable: true, highlight: true, options: opts("80+ White", "80+ Bronze", "80+ Silver", "80+ Gold", "80+ Platinum", "80+ Titanium"), group: "core" },
    { key: "modular", label: "الكيابل", labelEn: "Modularity", type: "select", filterable: true, options: opts(["full", "مودولر كامل"], ["semi", "شبه مودولر"], ["none", "ثابتة"]), group: "core" },
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "text", ltr: true, placeholder: "Corsair", group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, placeholder: "RM850x", group: "core" },
    { key: "atx3", label: "يدعم ATX 3.0 / 12VHPWR", labelEn: "ATX 3.0", type: "boolean", filterable: true, group: "extras" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, group: "condition" },
  ],
};

const cooling: SpecSchema = {
  key: "cooling",
  fields: [
    { key: "type", label: "النوع", labelEn: "Type", type: "select", required: true, filterable: true, highlight: true, options: opts(["air", "مبرد هوائي"], ["aio", "مائي AIO"], ["fans", "مراوح كيس"], ["custom", "تبريد مائي مخصص"]), group: "core" },
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "text", ltr: true, placeholder: "Arctic", group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, highlight: true, placeholder: "Liquid Freezer III 360", group: "core" },
    { key: "radiator", label: "مقاس الرادياتير", labelEn: "Radiator", type: "select", unit: "mm", filterable: true, options: opts("120", "240", "280", "360", "420"), group: "core" },
    { key: "sockets", label: "السوكتات المدعومة", labelEn: "Socket support", type: "text", ltr: true, placeholder: "AM5, LGA1700", group: "core" },
    { key: "rgb", label: "إضاءة RGB", labelEn: "RGB", type: "boolean", filterable: true, group: "extras" },
  ],
};

const monitor: SpecSchema = {
  key: "monitor",
  fields: [
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "select", filterable: true, options: opts("Samsung", "LG", "ASUS", "MSI", "Dell", "Gigabyte", "AOC", "BenQ", "ViewSonic", "Xiaomi", ["other", "أخرى"]), group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, placeholder: "Odyssey G7", group: "core" },
    { key: "size", label: "المقاس", labelEn: "Size", type: "select", unit: "″", required: true, filterable: true, highlight: true, options: opts("22", "24", "25", "27", "32", "34", "38", "42", "45", "49"), group: "core" },
    { key: "resolution", label: "الدقة", labelEn: "Resolution", type: "select", required: true, filterable: true, highlight: true, options: opts(["1080p", "FHD 1080p"], ["1440p", "QHD 1440p"], ["uw1440", "Ultrawide 1440p"], ["4k", "4K UHD"], ["5k", "5K+"]), group: "core" },
    { key: "refreshRate", label: "معدل التحديث", labelEn: "Refresh rate", type: "select", unit: "Hz", required: true, filterable: true, highlight: true, options: opts("60", "75", "100", "144", "165", "180", "240", "360", "480"), group: "core" },
    { key: "panel", label: "نوع اللوحة", labelEn: "Panel", type: "select", filterable: true, options: opts("IPS", "VA", "TN", "OLED", "QD-OLED", "Mini-LED"), group: "core" },
    { key: "responseMs", label: "زمن الاستجابة", labelEn: "Response time", type: "number", unit: "ms", min: 0, max: 50, group: "core" },
    { key: "deadPixels", label: "بكسلات ميتة", labelEn: "Dead pixels", type: "tristate", filterable: true, group: "condition" },
    { key: "burnIn", label: "احتراق شاشة (OLED)", labelEn: "Burn-in", type: "tristate", group: "condition" },
    { key: "standIncluded", label: "القاعدة الأصلية مرفقة", labelEn: "Stand included", type: "boolean", group: "extras" },
    { key: "boxIncluded", label: "الكرتون متوفر", labelEn: "Box included", type: "boolean", group: "extras" },
  ],
};

const consoleSchema: SpecSchema = {
  key: "console",
  fields: [
    { key: "platform", label: "الجهاز", labelEn: "Platform", type: "select", required: true, filterable: true, highlight: true, options: opts("PS5 Pro", "PS5", "PS4 Pro", "PS4", "Xbox Series X", "Xbox Series S", "Nintendo Switch 2", "Nintendo Switch OLED", "Nintendo Switch", "Steam Deck OLED", "Steam Deck", "ROG Ally", "Legion Go", ["other", "أخرى"]), group: "core" },
    { key: "edition", label: "النسخة", labelEn: "Edition", type: "select", filterable: true, highlight: true, options: opts(["disc", "بقارئ أقراص"], ["digital", "ديجيتال"]), group: "core" },
    { key: "storage", label: "السعة", labelEn: "Storage", type: "text", ltr: true, placeholder: "1TB", group: "core" },
    { key: "controllers", label: "عدد اليدّات", labelEn: "Controllers", type: "number", min: 0, max: 8, group: "extras" },
    { key: "games", label: "ألعاب مرفقة", labelEn: "Games included", type: "text", placeholder: "FC 25، Spider-Man 2", group: "extras" },
    { key: "repaired", label: "سبق فكّه أو صيانته", labelEn: "Opened / repaired", type: "tristate", group: "condition" },
    { key: "boxIncluded", label: "الكرتون متوفر", labelEn: "Box included", type: "boolean", filterable: true, group: "extras" },
    { key: "warranty", label: "الضمان", labelEn: "Warranty", type: "select", options: WARRANTY, group: "condition" },
  ],
};

const peripheral: SpecSchema = {
  key: "peripheral",
  fields: [
    { key: "type", label: "النوع", labelEn: "Type", type: "select", required: true, filterable: true, options: opts(["keyboard", "كيبورد"], ["mouse", "ماوس"], ["headset", "سماعة"], ["controller", "يد تحكم"], ["microphone", "مايك"], ["webcam", "كاميرا ويب"], ["mousepad", "ماوس باد"], ["other", "أخرى"]), group: "core" },
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "text", ltr: true, required: true, highlight: true, placeholder: "Logitech", group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, required: true, highlight: true, placeholder: "G Pro X Superlight 2", group: "core" },
    { key: "connection", label: "طريقة الاتصال", labelEn: "Connection", type: "select", filterable: true, highlight: true, options: opts(["wired", "سلكي"], ["wireless", "لاسلكي"], ["bluetooth", "بلوتوث"], ["multi", "متعدد"]), group: "core" },
    { key: "switches", label: "السويتشات / الحساس", labelEn: "Switches / sensor", type: "text", ltr: true, placeholder: "Gateron Yellow", group: "core" },
    { key: "included", label: "الملحقات المرفقة", labelEn: "Included", type: "text", placeholder: "الدونقل، كيبل الشحن", group: "extras" },
    { key: "boxIncluded", label: "الكرتون متوفر", labelEn: "Box included", type: "boolean", group: "extras" },
  ],
};

const accessory: SpecSchema = {
  key: "accessory",
  fields: [
    { key: "type", label: "النوع", labelEn: "Type", type: "select", required: true, filterable: true, options: opts(["case", "كيس"], ["cables", "كيابل وتحويلات"], ["network", "شبكات وراوترات"], ["dock", "منافذ وتوسعة"], ["bag", "حقائب"], ["ups", "UPS وحماية"], ["other", "أخرى"]), group: "core" },
    { key: "brand", label: "الشركة", labelEn: "Brand", type: "text", ltr: true, highlight: true, group: "core" },
    { key: "model", label: "الموديل", labelEn: "Model", type: "text", ltr: true, highlight: true, group: "core" },
    { key: "compatibility", label: "التوافق", labelEn: "Compatibility", type: "text", placeholder: "ATX، Mini-ITX", group: "core" },
    { key: "included", label: "الملحقات المرفقة", labelEn: "Included", type: "text", group: "extras" },
  ],
};

export const SPEC_SCHEMAS = {
  desktop,
  laptop,
  gpu,
  cpu,
  motherboard,
  ram,
  storage,
  psu,
  cooling,
  monitor,
  console: consoleSchema,
  peripheral,
  accessory,
} as const satisfies Record<string, SpecSchema>;

export type SpecSchemaKey = keyof typeof SPEC_SCHEMAS;

export function getSpecSchema(key: string): SpecSchema | undefined {
  return (SPEC_SCHEMAS as Record<string, SpecSchema>)[key];
}
