import type { SpecSchemaKey } from "./specs";

export type CategoryIcon =
  | "monitor-smartphone" | "pc" | "laptop" | "gpu" | "cpu" | "motherboard" | "ram" | "storage"
  | "psu" | "cooling" | "monitor" | "console" | "peripheral" | "accessory";

export interface CategorySeed {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  icon: CategoryIcon;
  schemaKey: SpecSchemaKey;
  featured?: boolean;
  children?: { slug: string; nameAr: string; nameEn: string }[];
}

/** Default taxonomy. Seeded into `categories`; admins can rename, reorder and hide. */
export const CATEGORY_SEED: CategorySeed[] = [
  {
    slug: "pcs", nameAr: "أجهزة مكتبية", nameEn: "Desktop PCs", icon: "pc", schemaKey: "desktop", featured: true,
    descriptionAr: "تجميعات قيمنق، أجهزة عمل ومحطات تصميم جاهزة.",
    children: [
      { slug: "gaming-pc", nameAr: "تجميعات قيمنق", nameEn: "Gaming PCs" },
      { slug: "workstation", nameAr: "محطات عمل وتصميم", nameEn: "Workstations" },
      { slug: "office-pc", nameAr: "أجهزة مكتبية", nameEn: "Office PCs" },
      { slug: "mini-pc", nameAr: "أجهزة صغيرة Mini PC", nameEn: "Mini PCs" },
      { slug: "mac-desktop", nameAr: "iMac و Mac", nameEn: "Mac desktops" },
    ],
  },
  {
    slug: "laptops", nameAr: "لابتوبات", nameEn: "Laptops", icon: "laptop", schemaKey: "laptop", featured: true,
    descriptionAr: "لابتوبات قيمنق وأعمال وماك بوك بحالة البطارية والمواصفات كاملة.",
    children: [
      { slug: "gaming-laptop", nameAr: "لابتوبات قيمنق", nameEn: "Gaming laptops" },
      { slug: "macbook", nameAr: "ماك بوك", nameEn: "MacBook" },
      { slug: "business-laptop", nameAr: "أعمال ودراسة", nameEn: "Business & study" },
      { slug: "2-in-1", nameAr: "2 في 1", nameEn: "2-in-1" },
    ],
  },
  {
    slug: "gpus", nameAr: "كروت الشاشة", nameEn: "Graphics cards", icon: "gpu", schemaKey: "gpu", featured: true,
    descriptionAr: "كروت NVIDIA وAMD مع سجل التعدين والحرارة وحالة الضمان.",
  },
  {
    slug: "cpus", nameAr: "معالجات", nameEn: "Processors", icon: "cpu", schemaKey: "cpu", featured: true,
    descriptionAr: "معالجات Intel وAMD حسب السوكت والجيل.",
  },
  {
    slug: "motherboards", nameAr: "لوحات أم", nameEn: "Motherboards", icon: "motherboard", schemaKey: "motherboard",
    descriptionAr: "لوحات أم بكل المقاسات والسوكتات.",
  },
  {
    slug: "ram", nameAr: "رامات", nameEn: "Memory (RAM)", icon: "ram", schemaKey: "ram", featured: true,
    descriptionAr: "رامات DDR4 وDDR5 للمكتبي واللابتوب.",
  },
  {
    slug: "storage", nameAr: "تخزين", nameEn: "Storage", icon: "storage", schemaKey: "storage", featured: true,
    descriptionAr: "أقراص NVMe وSSD وHDD مع نسبة الصحة.",
    children: [
      { slug: "nvme", nameAr: "NVMe M.2", nameEn: "NVMe" },
      { slug: "sata-ssd", nameAr: "SATA SSD", nameEn: "SATA SSD" },
      { slug: "hdd", nameAr: "هارديسك HDD", nameEn: "HDD" },
      { slug: "external-storage", nameAr: "تخزين خارجي", nameEn: "External" },
    ],
  },
  {
    slug: "psu", nameAr: "مزودات طاقة", nameEn: "Power supplies", icon: "psu", schemaKey: "psu",
    descriptionAr: "باورات حسب القدرة وشهادة الكفاءة.",
  },
  {
    slug: "cooling", nameAr: "تبريد", nameEn: "Cooling", icon: "cooling", schemaKey: "cooling",
    descriptionAr: "مبردات هوائية ومائية ومراوح.",
    children: [
      { slug: "air-coolers", nameAr: "مبردات هوائية", nameEn: "Air coolers" },
      { slug: "aio", nameAr: "تبريد مائي AIO", nameEn: "AIO liquid" },
      { slug: "case-fans", nameAr: "مراوح كيس", nameEn: "Case fans" },
    ],
  },
  {
    slug: "monitors", nameAr: "شاشات", nameEn: "Monitors", icon: "monitor", schemaKey: "monitor", featured: true,
    descriptionAr: "شاشات قيمنق واحترافية مع حالة البكسلات.",
  },
  {
    slug: "consoles", nameAr: "أجهزة ألعاب", nameEn: "Consoles & handhelds", icon: "console", schemaKey: "console",
    descriptionAr: "بلايستيشن، إكس بوكس، نينتندو وأجهزة محمولة.",
    children: [
      { slug: "playstation", nameAr: "بلايستيشن", nameEn: "PlayStation" },
      { slug: "xbox", nameAr: "إكس بوكس", nameEn: "Xbox" },
      { slug: "nintendo", nameAr: "نينتندو", nameEn: "Nintendo" },
      { slug: "handheld-pc", nameAr: "أجهزة محمولة", nameEn: "Handheld PCs" },
    ],
  },
  {
    slug: "peripherals", nameAr: "ملحقات قيمنق", nameEn: "Peripherals", icon: "peripheral", schemaKey: "peripheral", featured: true,
    descriptionAr: "كيبوردات، ماوسات، سماعات ويدّات تحكم.",
    children: [
      { slug: "keyboards", nameAr: "كيبوردات", nameEn: "Keyboards" },
      { slug: "mice", nameAr: "ماوسات", nameEn: "Mice" },
      { slug: "headsets", nameAr: "سماعات", nameEn: "Headsets" },
      { slug: "controllers", nameAr: "يدّات تحكم", nameEn: "Controllers" },
    ],
  },
  {
    slug: "accessories", nameAr: "إكسسوارات", nameEn: "Accessories", icon: "accessory", schemaKey: "accessory",
    descriptionAr: "كيسات، كيابل، شبكات وحقائب.",
  },
];
