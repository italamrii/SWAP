type Level = "unverified" | "seller_report" | "platform_checked" | "partner_verified";

export interface SeedInspection {
  source: "manual" | "platform_tool" | "store_partner";
  level: Exclude<Level, "unverified">;
  status?: "approved" | "submitted";
  partnerName?: string;
  daysAgo: number;
  report: {
    cpuModel?: string; gpuModel?: string; motherboard?: string; ramCapacityGb?: number; ramSpeedMhz?: number;
    storage?: { model: string; type?: string; capacityGb?: number; healthPct?: number; powerOnHours?: number }[];
    temperatures?: { cpuIdle?: number; cpuLoad?: number; gpuIdle?: number; gpuLoad?: number };
    batteryHealthPct?: number; batteryCycles?: number; screenNotes?: string; portsNotes?: string; os?: string;
    benchmarks?: { name: string; score: string; note?: string }[];
    stressTest?: { tool?: string; durationMin?: number; passed?: boolean; notes?: string };
    checklist?: Record<string, boolean>;
    summary?: string;
  };
}

export interface SeedListing {
  seller: string;
  category: string;
  sub?: string;
  title: string;
  description: string;
  price: number; // SAR
  negotiable?: boolean;
  swap?: boolean;
  swapDetails?: string;
  condition: "new" | "like_new" | "excellent" | "good" | "fair" | "for_parts";
  city?: string;
  specs: Record<string, string | number | boolean>;
  tags?: string[];
  images: string[];
  status?: "active" | "sold" | "pending_review" | "hidden";
  daysAgo: number;
  views?: number;
  inspection?: SeedInspection;
  oldPrice?: number;
}

const ok = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, true]));

export const SEED_LISTINGS: SeedListing[] = [
  {
    seller: "abdullah", category: "gpus", title: "RTX 4070 Super من ASUS Dual — نظيف جدًا بضمان وكيل",
    description: "كرت RTX 4070 Super نسخة ASUS Dual OC، مشترى من جرير قبل 8 أشهر والفاتورة موجودة، وضمان الوكيل ساري لين 2027.\n\nاستخدامه كان ألعاب فقط بمعدل ساعتين إلى ثلاث يوميًا، وما تعرّض لتعدين أو أوفركلوك. الحرارة ممتازة وما فيه أي صوت من المراوح (Coil whine معدوم تقريبًا).\n\nسبب البيع: ترقيت إلى 4080 Super. الكرتون وكل الملحقات موجودة.\n\nالاستلام في الرياض — حي الملقا، وأقدر أشغّله قدامك على جهازي.",
    price: 2650, oldPrice: 2800, negotiable: true, swap: true, swapDetails: "أقبل البدل بـ RX 7900 GRE مع فرق، أو شاشة 1440p 240Hz.", condition: "like_new",
    specs: { chipset: "NVIDIA", model: "RTX 4070 Super", brand: "ASUS", vram: "12", mined: "no", repaired: "no", tempIdle: 34, tempLoad: 66, boxIncluded: true, warranty: "agent" },
    tags: ["RTX", "4070", "ضمان", "كرت شاشة"], images: ["gpu-a", "gpu-d", "gpu-b"], daysAgo: 1, views: 412,
    inspection: {
      source: "platform_tool", level: "platform_checked", daysAgo: 2,
      report: {
        gpuModel: "NVIDIA GeForce RTX 4070 SUPER 12GB (ASUS DUAL-RTX4070S-O12G)",
        temperatures: { gpuIdle: 34, gpuLoad: 66 },
        benchmarks: [{ name: "3DMark Time Spy", score: "20,412", note: "Graphics score" }, { name: "Cyberpunk 2077 1440p Ultra", score: "92 FPS", note: "متوسط بدون DLSS FG" }],
        stressTest: { tool: "FurMark 2", durationMin: 30, passed: true, notes: "ثبات تام، أقصى حرارة 68° وأقصى Hotspot 79°" },
        checklist: ok("powers_on", "no_physical_damage", "no_artifacts", "fans_ok", "ports_ok", "stress_passed", "serial_matches"),
        summary: "الكرت يعمل بأداء مطابق للمرجع، الحرارة ضمن المعدل الطبيعي، ولا توجد علامات فك أو تعدين.",
      },
    },
  },
  {
    seller: "faisal", category: "pcs", sub: "gaming-pc", title: "تجميعة قيمنق Ryzen 7 7800X3D + RTX 4080 Super — مائي 360",
    description: "تجميعة قيمنق عالية جاهزة لدقة 1440p و4K. كل القطع مشتراة جديدة قبل سنة تقريبًا، والجهاز متعوب عليه في الترتيب وإدارة الكيابل.\n\nالقطع:\n• Ryzen 7 7800X3D\n• RTX 4080 Super Gigabyte Gaming OC\n• MSI MAG B650 Tomahawk WiFi\n• 32GB DDR5 6000 CL30 G.Skill Trident Z5\n• Samsung 990 Pro 2TB\n• Corsair RM1000x\n• Arctic Liquid Freezer III 360\n• Lian Li O11 Dynamic EVO\n\nويندوز 11 أصلي مفعّل. أداء ممتاز في كل الألعاب الحالية، تقدر تجربه قبل الشراء.",
    price: 11500, negotiable: true, swap: false, condition: "excellent",
    specs: { cpu: "Ryzen 7 7800X3D", cpuBrand: "AMD", gpu: "RTX 4080 Super 16GB", gpuBrand: "NVIDIA", motherboard: "MSI MAG B650 Tomahawk WiFi", ramGb: "32", ramType: "DDR5", ramSpeed: 6000, storage: "2TB NVMe Samsung 990 Pro", storageType: "NVMe", psuWatt: 1000, cooling: "aio", case: "Lian Li O11 Dynamic EVO", os: "Windows 11", usage: "gaming", age: "1to2y", warranty: "store" },
    tags: ["تجميعة", "7800X3D", "4080", "قيمنق"], images: ["pc-d", "pc-a", "pc-b"], daysAgo: 2, views: 690,
    inspection: {
      source: "store_partner", level: "partner_verified", partnerName: "مختبر الشرقية للحاسبات", daysAgo: 3,
      report: {
        cpuModel: "AMD Ryzen 7 7800X3D 8-Core", gpuModel: "NVIDIA GeForce RTX 4080 SUPER 16GB", motherboard: "MSI MAG B650 TOMAHAWK WIFI (MS-7D75)",
        ramCapacityGb: 32, ramSpeedMhz: 6000,
        storage: [{ model: "Samsung SSD 990 PRO 2TB", type: "NVMe", capacityGb: 2048, healthPct: 98, powerOnHours: 2140 }],
        temperatures: { cpuIdle: 38, cpuLoad: 79, gpuIdle: 31, gpuLoad: 64 },
        os: "Windows 11 Pro 23H2 (مفعّل)",
        portsNotes: "جميع منافذ USB الأمامية والخلفية تعمل، الواي فاي 6E والبلوتوث سليمة.",
        benchmarks: [{ name: "Cinebench R23 Multi", score: "18,250" }, { name: "3DMark Time Spy", score: "27,880" }, { name: "CrystalDiskMark Seq Read", score: "7,410 MB/s" }],
        stressTest: { tool: "OCCT + Prime95", durationMin: 60, passed: true, notes: "لا انطفاء ولا أخطاء ذاكرة" },
        checklist: ok("powers_on", "no_physical_damage", "no_artifacts", "fans_ok", "ports_ok", "wifi_bt_ok", "storage_healthy", "memtest_passed", "stress_passed"),
        summary: "فحص فعلي في المختبر لمدة ساعتين. الجهاز نظيف ومستقر، وصحة القرص 98%.",
      },
    },
  },
  {
    seller: "reem", category: "laptops", sub: "macbook", title: "MacBook Pro 14 M3 Pro — 18GB / 512GB، بطارية 96%",
    description: "ماك بوك برو 14 إنش بمعالج M3 Pro (11 نواة CPU و14 نواة GPU)، رام 18GB وتخزين 512GB، لون أسود فضائي.\n\nاستخدام شخصي في التصميم، ودايم عليه كفر وحامي شاشة. ما فيه ولا خدش، والبطارية 96% مع 112 دورة شحن فقط.\n\nمعه الشاحن الأصلي 70W والكرتون. الجهاز مسجّل خروج من iCloud وجاهز للتسليم.",
    price: 6900, negotiable: true, swap: true, swapDetails: "أفكر في بدل بلابتوب ويندوز للقيمنق (RTX 4070 أو أعلى) مع فرق.", condition: "like_new",
    specs: { brand: "Apple", model: "MacBook Pro 14 M3 Pro", cpu: "Apple M3 Pro 11-core", gpu: "14-core GPU", ramGb: "18", storageGb: "512", screenSize: "14", refreshRate: "120", batteryHealth: 96, batteryCycles: 112, keyboard: "ar-en", chargerIncluded: true, boxIncluded: true, warranty: "expired" },
    tags: ["ماك بوك", "M3", "Apple"], images: ["laptop-b", "laptop-a"], daysAgo: 3, views: 530,
    inspection: {
      source: "manual", level: "seller_report", daysAgo: 4,
      report: {
        cpuModel: "Apple M3 Pro (11-core CPU, 14-core GPU)", ramCapacityGb: 18,
        storage: [{ model: "APPLE SSD AP0512Z", type: "NVMe", capacityGb: 512, healthPct: 100 }],
        batteryHealthPct: 96, batteryCycles: 112, screenNotes: "شاشة Liquid Retina XDR سليمة تمامًا، بدون بكسلات ميتة أو تسريب إضاءة.", portsNotes: "جميع المنافذ (3× Thunderbolt، HDMI، SD، MagSafe) تعمل.",
        os: "macOS Sequoia 15.1",
        checklist: ok("powers_on", "no_physical_damage", "display_ok", "ports_ok", "keyboard_ok", "battery_ok", "wifi_bt_ok", "storage_healthy"),
        summary: "صور من إعدادات النظام (صحة البطارية وعدد الدورات) مرفقة.",
      },
    },
  },
  {
    seller: "turki", category: "monitors", title: "شاشة Samsung Odyssey OLED G6 — 27 إنش 360Hz",
    description: "شاشة OLED بمعدل تحديث 360Hz ودقة 1440p، أفضل شاشة جربتها للألعاب التنافسية.\n\nعمرها 5 أشهر، بدون أي احتراق (Burn-in)، وأستخدم خاصية Pixel Refresh بانتظام. القاعدة الأصلية والكيابل والكرتون موجودة.\n\nالبيع بسبب انتقالي لشاشة Ultrawide.",
    price: 3100, negotiable: false, swap: true, swapDetails: "أقبل بدل بشاشة Ultrawide 34 OLED مع فرق مني.", condition: "like_new",
    specs: { brand: "Samsung", model: "Odyssey OLED G6 G60SD", size: "27", resolution: "1440p", refreshRate: "360", panel: "QD-OLED", responseMs: 0.03, deadPixels: "no", burnIn: "no", standIncluded: true, boxIncluded: true },
    tags: ["OLED", "360Hz", "سامسونج"], images: ["monitor-d", "monitor-a"], daysAgo: 1, views: 288,
    inspection: {
      source: "manual", level: "seller_report", daysAgo: 1,
      report: { screenNotes: "اختبار بكسلات بالألوان الأساسية — لا توجد بكسلات ميتة أو احتراق. صور الاختبار مرفقة.", portsNotes: "2× HDMI 2.1 و DisplayPort 1.4 تعمل.", checklist: ok("powers_on", "no_physical_damage", "display_ok", "ports_ok", "serial_matches") },
    },
  },
  {
    seller: "nawaf", category: "gpus", title: "RX 6700 XT من Sapphire Pulse — 12GB",
    description: "كرت Sapphire Pulse RX 6700 XT، ممتاز لدقة 1080p و1440p. استخدمته سنتين في الألعاب.\n\nتم تغيير المعجون الحراري قبل شهر والحرارة ممتازة. بدون كرتون.",
    price: 1050, negotiable: true, swap: true, swapDetails: "أبدّل بمعالج Ryzen 7 5700X3D.", condition: "good", city: "hail",
    specs: { chipset: "AMD", model: "RX 6700 XT", brand: "Sapphire", vram: "12", mined: "no", repaired: "yes", tempIdle: 40, tempLoad: 74, boxIncluded: false, warranty: "expired" },
    tags: ["AMD", "6700XT"], images: ["gpu-b"], daysAgo: 4, views: 133,
  },
  {
    seller: "faisal", category: "cpus", title: "معالج Intel Core i7-14700K — مع الكرتون",
    description: "معالج i7-14700K، تم تحديث البايوس للإصدار الذي يعالج مشكلة الجهد (0x12B) من أول يوم. ما سويت له أوفركلوك.\n\nمستخدم 6 أشهر في جهاز عمل ومونتاج. الكرتون موجود.",
    price: 1150, negotiable: true, condition: "excellent",
    specs: { brand: "Intel", model: "Core i7-14700K", generation: "الجيل 14", socket: "LGA1700", cores: "20C / 28T", coolerIncluded: false, overclocked: "no", boxIncluded: true, warranty: "store" },
    tags: ["Intel", "14700K"], images: ["cpu-a", "cpu-b"], daysAgo: 5, views: 201,
  },
  {
    seller: "lama", category: "laptops", sub: "gaming-laptop", title: "ASUS ROG Zephyrus G14 (2024) — RTX 4070، شاشة OLED",
    description: "لابتوب ROG Zephyrus G14 موديل 2024 بشاشة OLED 3K 120Hz. معالج Ryzen 9 8945HS وكرت RTX 4070 8GB ورام 32GB.\n\nخفيف ومثالي للدراسة والقيمنق. البطارية 91%، والجهاز ما فيه أي ملاحظات.\n\nمعه الشاحن الأصلي 180W وشنطة ROG.",
    price: 6200, negotiable: true, swap: false, condition: "excellent",
    specs: { brand: "ASUS", model: "ROG Zephyrus G14 2024", cpu: "Ryzen 9 8945HS", gpu: "RTX 4070 8GB", ramGb: "32", storageGb: "1024", screenSize: "14", refreshRate: "120", batteryHealth: 91, batteryCycles: 186, keyboard: "ar-en", chargerIncluded: true, boxIncluded: false, warranty: "agent" },
    tags: ["ROG", "G14", "OLED"], images: ["laptop-d", "laptop-c"], daysAgo: 2, views: 377,
    inspection: {
      source: "platform_tool", level: "platform_checked", daysAgo: 2,
      report: {
        cpuModel: "AMD Ryzen 9 8945HS w/ Radeon 780M", gpuModel: "NVIDIA GeForce RTX 4070 Laptop GPU 8GB", ramCapacityGb: 32, ramSpeedMhz: 6400,
        storage: [{ model: "Micron 2400 1TB", type: "NVMe", capacityGb: 1024, healthPct: 97, powerOnHours: 1310 }],
        temperatures: { cpuIdle: 46, cpuLoad: 88, gpuIdle: 41, gpuLoad: 76 }, batteryHealthPct: 91, batteryCycles: 186,
        screenNotes: "OLED بدون بكسلات ميتة. لم تُرصد علامات احتراق.", os: "Windows 11 Home",
        benchmarks: [{ name: "Cinebench R23 Multi", score: "16,940" }, { name: "3DMark Time Spy", score: "11,720" }],
        stressTest: { tool: "SWAP Inspect stress (CPU+GPU)", durationMin: 20, passed: true, notes: "خفض بسيط في التردد بعد 15 دقيقة — طبيعي لهذا الحجم" },
        checklist: ok("powers_on", "no_physical_damage", "display_ok", "no_artifacts", "fans_ok", "ports_ok", "keyboard_ok", "battery_ok", "wifi_bt_ok", "storage_healthy", "stress_passed"),
        summary: "بيانات مجمّعة آليًا عبر أداة سواب ومطابقة للبصمة الرقمية.",
      },
    },
  },
  {
    seller: "abdullah", category: "ram", title: "رامات G.Skill Trident Z5 RGB DDR5 — 32GB (2×16) 6000MHz CL30",
    description: "طقم G.Skill Trident Z5 RGB بتوقيت CL30، متوافق مع EXPO وXMP. مستخدم مع AM5 بدون أي مشاكل استقرار.\n\nالكرتون موجود.",
    price: 420, negotiable: false, swap: true, swapDetails: "أبدّل بطقم 64GB مع فرق مني.", condition: "excellent",
    specs: { ddr: "DDR5", capacityGb: "32", speed: 6000, kit: "2x", formFactor: "dimm", timings: "CL30-38-38-96", brand: "G.Skill Trident Z5 RGB", rgb: true, warranty: "store" },
    tags: ["DDR5", "رامات"], images: ["ram-d", "ram-a"], daysAgo: 6, views: 154,
    inspection: { source: "manual", level: "seller_report", daysAgo: 6, report: { ramCapacityGb: 32, ramSpeedMhz: 6000, benchmarks: [{ name: "MemTest86", score: "4 Passes / 0 Errors" }], checklist: ok("powers_on", "memtest_passed", "no_physical_damage") } },
  },
  {
    seller: "sarah", category: "storage", sub: "nvme", title: "Samsung 990 Pro 2TB NVMe — صحة 99%",
    description: "قرص Samsung 990 Pro سعة 2TB، أسرع قرص Gen4 تقريبًا. صحة القرص 99% حسب Samsung Magician، والمكتوب عليه 14TB فقط.\n\nأبيعه لأني نقلت للابتوب.",
    price: 560, negotiable: true, condition: "like_new", city: "jeddah",
    specs: { type: "nvme", capacityGb: "2048", healthPct: 99, brand: "Samsung", model: "990 Pro", pcieGen: "Gen4", written: 14, warranty: "agent" },
    tags: ["NVMe", "سامسونج", "SSD"], images: ["ssd-b", "ssd-a"], daysAgo: 3, views: 98,
  },
  {
    seller: "turki", category: "peripherals", sub: "mice", title: "ماوس Logitech G Pro X Superlight 2 — أبيض",
    description: "ماوس لاسلكي خفيف 60 جرام، حساس HERO 2. استخدام شهرين فقط، وكل الملحقات موجودة (الدونقل، كيبل الشحن، الملصقات).",
    price: 390, negotiable: false, swap: false, condition: "like_new",
    specs: { type: "mouse", brand: "Logitech", model: "G Pro X Superlight 2", connection: "wireless", switches: "HERO 2 · LIGHTFORCE", included: "الدونقل، كيبل USB-C، ملصقات Grip", boxIncluded: true },
    tags: ["لوجيتك", "ماوس"], images: ["mouse-a"], daysAgo: 7, views: 76,
  },
  {
    seller: "mohammed", category: "consoles", sub: "playstation", title: "PS5 Slim نسخة الأقراص + يدّتين + 3 ألعاب",
    description: "بلايستيشن 5 سليم بقارئ أقراص، سعة 1TB. معه يدّتين DualSense (واحدة جديدة)، وثلاث ألعاب: FC 25، Spider-Man 2، Gran Turismo 7.\n\nالجهاز ما انفتح، ونظيف جدًا.",
    price: 1750, negotiable: true, swap: true, swapDetails: "أقبل بدل بـ Steam Deck OLED.", condition: "excellent",
    specs: { platform: "PS5", edition: "disc", storage: "1TB", controllers: 2, games: "FC 25، Spider-Man 2، Gran Turismo 7", repaired: "no", boxIncluded: true, warranty: "expired" },
    tags: ["PS5", "بلايستيشن"], images: ["console-b", "console-a"], daysAgo: 1, views: 512,
  },
  {
    seller: "khaled", category: "psu", title: "باور Corsair RM850x Shift — 80+ Gold مودولر",
    description: "مزود طاقة Corsair RM850x Shift بالكيابل الجانبية، يدعم ATX 3.0 وكيبل 12VHPWR. مستخدم سنة، هادي جدًا.",
    price: 380, negotiable: true, condition: "excellent", city: "tabuk",
    specs: { wattage: 850, rating: "80+ Gold", modular: "full", brand: "Corsair", model: "RM850x Shift", atx3: true, warranty: "agent" },
    tags: ["باور", "Corsair"], images: ["psu-a", "psu-b"], daysAgo: 8, views: 64,
  },
  {
    seller: "faisal", category: "motherboards", title: "ASUS ROG Strix B650E-F Gaming WiFi",
    description: "لوحة أم AM5 بشريحة B650E، تدعم PCIe 5.0 للكرت والقرص. البايوس محدّث لآخر إصدار. السوكت سليم تمامًا والكرتون والملحقات كاملة.",
    price: 780, negotiable: true, swap: true, swapDetails: "أبدّل بلوحة X670E مع فرق.", condition: "excellent",
    specs: { brand: "ASUS", model: "ROG Strix B650E-F Gaming WiFi", chipset: "B650E", socket: "AM5", formFactor: "ATX", ramType: "DDR5", wifi: true, pins: "perfect", boxIncluded: true, warranty: "store" },
    tags: ["AM5", "ROG"], images: ["motherboard-a", "motherboard-d"], daysAgo: 9, views: 88,
  },
  {
    seller: "yazeed", category: "gpus", title: "RTX 3080 10GB من MSI Gaming X Trio",
    description: "كرت RTX 3080 بحالة جيدة، أداء قوي لدقة 1440p. الكرت كان في جهاز تعدين لمدة 4 أشهر في 2021 ثم ألعاب فقط، وأوضحه للأمانة.\n\nتم تنظيفه وتغيير الباد الحراري.",
    price: 1300, negotiable: true, swap: true, swapDetails: "أبدّل بـ RTX 4060 Ti مع فرق.", condition: "good", city: "buraydah",
    specs: { chipset: "NVIDIA", model: "RTX 3080", brand: "MSI", vram: "10", mined: "yes", repaired: "yes", tempIdle: 42, tempLoad: 77, boxIncluded: false, warranty: "expired" },
    tags: ["3080", "MSI"], images: ["gpu-c"], daysAgo: 2, views: 241,
  },
  {
    seller: "hind", category: "laptops", sub: "business-laptop", title: "Lenovo ThinkPad X1 Carbon Gen 11 — i7 / 16GB",
    description: "ثينك باد X1 كاربون الجيل 11، خفيف جدًا (1.1 كجم) ومثالي للعمل والسفر. شاشة 2.8K OLED.\n\nالجهاز من شركة وتم تهيئته بالكامل. البطارية 88%.",
    price: 3900, negotiable: true, condition: "excellent", city: "abha",
    specs: { brand: "Lenovo", model: "ThinkPad X1 Carbon Gen 11", cpu: "Core i7-1365U", gpu: "Intel Iris Xe", ramGb: "16", storageGb: "512", screenSize: "14", refreshRate: "60", batteryHealth: 88, keyboard: "ar-en", chargerIncluded: true, boxIncluded: false, warranty: "expired" },
    tags: ["ثينك باد", "لينوفو"], images: ["laptop-a"], daysAgo: 10, views: 120,
  },
  {
    seller: "abdullah", category: "cooling", sub: "aio", title: "تبريد مائي Arctic Liquid Freezer III 360 — أسود",
    description: "أفضل مبرد مائي قيمة مقابل سعر. مستخدم 7 أشهر على 7800X3D، الحرارة ممتازة وما فيه أي صوت مضخة. يدعم AM5 وLGA1700 (القطع موجودة).",
    price: 320, negotiable: true, condition: "excellent",
    specs: { type: "aio", brand: "Arctic", model: "Liquid Freezer III 360", radiator: "360", sockets: "AM5, AM4, LGA1700, LGA1851", rgb: false },
    tags: ["تبريد", "مائي"], images: ["cooler-a"], daysAgo: 11, views: 57,
  },
  {
    seller: "reem", category: "monitors", title: "شاشة Dell UltraSharp U2723QE — 27 إنش 4K للتصميم",
    description: "شاشة احترافية IPS Black بدقة 4K، معايرة ألوان من المصنع (98% DCI-P3). فيها USB-C بشحن 90W وتشتغل Hub. مثالية للمصممين.",
    price: 1650, negotiable: true, condition: "excellent", city: "jeddah",
    specs: { brand: "Dell", model: "UltraSharp U2723QE", size: "27", resolution: "4k", refreshRate: "60", panel: "IPS", responseMs: 5, deadPixels: "no", standIncluded: true, boxIncluded: true },
    tags: ["ديل", "4K", "تصميم"], images: ["monitor-b"], daysAgo: 12, views: 91,
  },
  {
    seller: "nawaf", category: "pcs", sub: "gaming-pc", title: "تجميعة اقتصادية i5-12400F + RTX 3060 — جاهزة للعب",
    description: "تجميعة ممتازة للمبتدئين، تشغّل أغلب الألعاب على 1080p بإعدادات عالية. الكيس فيه 3 مراوح RGB.\n\ni5-12400F، RTX 3060 12GB، رام 16GB DDR4 3200، SSD 1TB، باور 650W برونز.",
    price: 2400, negotiable: true, swap: true, swapDetails: "أبدّل بلابتوب قيمنق بنفس المستوى.", condition: "good", city: "hail",
    specs: { cpu: "Core i5-12400F", cpuBrand: "Intel", gpu: "RTX 3060 12GB", gpuBrand: "NVIDIA", motherboard: "MSI PRO B660M-A", ramGb: "16", ramType: "DDR4", ramSpeed: 3200, storage: "1TB NVMe", storageType: "NVMe", psuWatt: 650, cooling: "air", os: "Windows 11", usage: "gaming", age: "2to3y", warranty: "expired" },
    tags: ["تجميعة", "اقتصادية"], images: ["pc-b"], daysAgo: 5, views: 166,
  },
  {
    seller: "turki", category: "peripherals", sub: "keyboards", title: "كيبورد Wooting 60HE+ — سويتشات مغناطيسية",
    description: "كيبورد Wooting 60HE+ بسويتشات Lekker، أفضل كيبورد للألعاب التنافسية (Rapid Trigger). معه كيكابس PBT إضافية.",
    price: 720, negotiable: false, swap: true, swapDetails: "أبدّل بـ Razer Huntsman V3 Pro Mini.", condition: "excellent",
    specs: { type: "keyboard", brand: "Wooting", model: "60HE+", connection: "wired", switches: "Lekker L60 (Hall Effect)", included: "كيكابس PBT إضافية، كيبل USB-C", boxIncluded: true },
    tags: ["كيبورد", "Wooting"], images: ["keyboard-d", "keyboard-a"], daysAgo: 3, views: 143,
  },
  {
    seller: "sarah", category: "peripherals", sub: "headsets", title: "سماعة SteelSeries Arctis Nova 7 لاسلكية",
    description: "سماعة لاسلكية بتقنية 2.4GHz وبلوتوث في نفس الوقت، بطارية تدوم 38 ساعة. وسادات الأذن نظيفة.",
    price: 380, negotiable: true, condition: "good", city: "jeddah",
    specs: { type: "headset", brand: "SteelSeries", model: "Arctis Nova 7", connection: "multi", included: "الدونقل، كيبل الشحن", boxIncluded: false },
    tags: ["سماعة"], images: ["headset-b"], daysAgo: 14, views: 44,
  },
  {
    seller: "khaled", category: "cpus", title: "Ryzen 5 5600X مع المبرد الأصلي",
    description: "معالج Ryzen 5 5600X بحالة ممتازة، مناسب للتجميعات الاقتصادية على AM4. معه مبرد Wraith Stealth الأصلي.",
    price: 360, negotiable: true, swap: true, swapDetails: "أبدّل بـ 5700X3D مع فرق مني.", condition: "good", city: "tabuk",
    specs: { brand: "AMD", model: "Ryzen 5 5600X", generation: "Ryzen 5000", socket: "AM4", cores: "6C / 12T", coolerIncluded: true, overclocked: "no", boxIncluded: true, warranty: "expired" },
    tags: ["Ryzen", "AM4"], images: ["cpu-c"], daysAgo: 6, views: 82,
  },
  {
    seller: "lama", category: "consoles", sub: "handheld-pc", title: "Steam Deck OLED 512GB — مع كفر رسمي",
    description: "ستيم دك OLED سعة 512GB، الشاشة أجمل بكثير من النسخة الأولى. مستخدم بشكل خفيف، ومعه الكفر الرسمي والشاحن.",
    price: 2100, negotiable: true, condition: "like_new",
    specs: { platform: "Steam Deck OLED", storage: "512GB", controllers: 0, repaired: "no", boxIncluded: true, warranty: "expired" },
    tags: ["ستيم دك", "Valve"], images: ["console-d"], daysAgo: 4, views: 205,
  },
  {
    seller: "mohammed", category: "storage", sub: "hdd", title: "هارديسك WD Red Plus 8TB — للـ NAS",
    description: "قرص WD Red Plus سعة 8TB، كان في NAS منزلي. صحة 94% بدون قطاعات تالفة.",
    price: 420, negotiable: true, condition: "good",
    specs: { type: "hdd", capacityGb: "8192", healthPct: 94, brand: "WD", model: "Red Plus WD80EFZZ", warranty: "expired" },
    tags: ["هارديسك", "NAS"], images: ["ssd-c"], daysAgo: 16, views: 31,
  },
  {
    seller: "hind", category: "accessories", title: "كيس Lian Li Lancool 216 — أسود مع مروحتين 160mm",
    description: "كيس بتدفق هواء ممتاز، يدعم كروت حتى 392mm. نظيف جدًا مع كل البراغي.",
    price: 230, negotiable: true, condition: "excellent", city: "abha",
    specs: { type: "case", brand: "Lian Li", model: "Lancool 216", compatibility: "E-ATX، ATX، Micro-ATX", included: "مروحتين 160mm ARGB، البراغي" },
    tags: ["كيس"], images: ["pc-c"], daysAgo: 13, views: 39,
  },
  {
    seller: "yazeed", category: "monitors", title: "شاشة LG UltraGear 27GP850 — 1440p 180Hz",
    description: "شاشة Nano IPS سريعة، ألوان ممتازة. فيها بكسل واحد عالق في الزاوية العلوية ما يبين أثناء الاستخدام، موضّح في الصور.",
    price: 780, negotiable: true, condition: "good", city: "buraydah",
    specs: { brand: "LG", model: "27GP850-B", size: "27", resolution: "1440p", refreshRate: "180", panel: "IPS", responseMs: 1, deadPixels: "yes", standIncluded: true, boxIncluded: false },
    tags: ["LG", "1440p"], images: ["monitor-c"], daysAgo: 7, views: 102,
  },
  {
    seller: "abdullah", category: "gpus", title: "RTX 4090 Founders Edition — فاتورة وضمان",
    description: "كرت RTX 4090 FE، الأقوى للألعاب والذكاء الاصطناعي. الفاتورة موجودة، والكرت مستخدم 10 أشهر بدون أي تعديل. الكيبل الأصلي 12VHPWR معه وما فيه أي أثر احتراق.",
    price: 7400, negotiable: true, condition: "excellent",
    specs: { chipset: "NVIDIA", model: "RTX 4090", brand: "fe", vram: "24", mined: "no", repaired: "no", tempIdle: 33, tempLoad: 70, boxIncluded: true, warranty: "store" },
    tags: ["4090", "FE"], images: ["gpu-d"], status: "sold", daysAgo: 20, views: 980,
  },
  {
    seller: "demo", category: "gpus", title: "RTX 3070 Ti من Gigabyte Eagle",
    description: "كرت RTX 3070 Ti بحالة ممتازة، ألعاب فقط، بدون تعدين. أبيعه لأني أجمع جهاز جديد.",
    price: 1150, negotiable: true, swap: true, swapDetails: "أبدّل بـ RX 7800 XT مع فرق مني.", condition: "excellent",
    specs: { chipset: "NVIDIA", model: "RTX 3070 Ti", brand: "Gigabyte", vram: "8", mined: "no", repaired: "no", tempIdle: 38, tempLoad: 72, boxIncluded: true, warranty: "expired" },
    tags: ["3070Ti"], images: ["gpu-b", "gpu-a"], daysAgo: 6, views: 118,
  },
  {
    seller: "demo", category: "ram", title: "رامات Corsair Vengeance DDR4 — 16GB (2×8) 3600MHz",
    description: "طقم رامات DDR4 مستقر جدًا، مناسب لتجميعات AM4 وIntel الجيل 10-13.",
    price: 160, negotiable: true, condition: "good",
    specs: { ddr: "DDR4", capacityGb: "16", speed: 3600, kit: "2x", formFactor: "dimm", timings: "CL18", brand: "Corsair Vengeance LPX", rgb: false, warranty: "expired" },
    tags: ["DDR4"], images: ["ram-a"], status: "pending_review", daysAgo: 0, views: 0,
  },
  {
    seller: "yazeed", category: "laptops", sub: "gaming-laptop", title: "لابتوب MSI Katana 15 — RTX 4060",
    description: "لابتوب قيمنق اقتصادي، i7-13620H وRTX 4060. استخدام سنة.",
    price: 3300, negotiable: true, condition: "good", city: "buraydah",
    specs: { brand: "MSI", model: "Katana 15 B13V", cpu: "Core i7-13620H", gpu: "RTX 4060 8GB", ramGb: "16", storageGb: "512", screenSize: "15.6", refreshRate: "144", batteryHealth: 84, chargerIncluded: true, boxIncluded: true, warranty: "expired" },
    tags: ["MSI", "قيمنق"], images: ["laptop-c"], status: "pending_review", daysAgo: 0, views: 0,
  },
  {
    seller: "faisal", category: "gpus", title: "RX 7900 XTX من PowerColor Red Devil — 24GB",
    description: "أقوى كرت من AMD، مثالي لدقة 4K. مستخدم 7 أشهر، بدون تعدين. الكرتون والحامل موجودين.",
    price: 3600, negotiable: true, swap: true, swapDetails: "أبدّل بـ RTX 4080 Super مع فرق مني.", condition: "excellent",
    specs: { chipset: "AMD", model: "RX 7900 XTX", brand: "PowerColor", vram: "24", mined: "no", repaired: "no", tempIdle: 36, tempLoad: 69, boxIncluded: true, warranty: "store" },
    tags: ["7900XTX", "AMD"], images: ["gpu-a"], daysAgo: 4, views: 222,
    inspection: { source: "manual", level: "seller_report", status: "submitted", daysAgo: 0, report: { gpuModel: "AMD Radeon RX 7900 XTX 24GB", temperatures: { gpuIdle: 36, gpuLoad: 69 }, benchmarks: [{ name: "3DMark Time Spy", score: "29,600" }], stressTest: { tool: "FurMark 2", durationMin: 20, passed: true }, checklist: ok("powers_on", "no_artifacts", "fans_ok", "stress_passed") } },
  },
];
