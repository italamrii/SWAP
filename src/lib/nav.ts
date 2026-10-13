/**
 * Single source of truth for marketplace navigation (header, drawer, category bar).
 * Every href must resolve to a real route — enforced by tests/nav.test.ts.
 */
export type NavIcon =
  | "home" | "grid" | "clock" | "swap" | "verified" | "folders" | "user" | "package" | "plus" | "chat" | "tag"
  | "heart" | "bell" | "settings" | "shield" | "info" | "lifebuoy" | "help" | "mail" | "building" | "file" | "lock";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** key into unread counts for a badge */
  badge?: "messages" | "offers" | "notifications";
  /** only for signed-in users (otherwise routed through sign-in) */
  auth?: boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const DRAWER_GROUPS: NavGroup[] = [
  {
    id: "market",
    title: "السوق",
    items: [
      { href: "/", label: "الرئيسية", icon: "home" },
      { href: "/browse", label: "جميع الإعلانات", icon: "grid" },
      { href: "/browse?sort=newest", label: "أحدث الإعلانات", icon: "clock" },
      { href: "/browse?swap=1", label: "إعلانات تقبل البدل", icon: "swap" },
      { href: "/browse?verified=1", label: "الإعلانات الموثّقة", icon: "verified" },
    ],
  },
  {
    id: "account",
    title: "حسابي",
    items: [
      { href: "/account", label: "حسابي", icon: "user", auth: true },
      { href: "/account/listings", label: "إعلاناتي", icon: "package", auth: true },
      { href: "/account/listings/new", label: "إضافة إعلان", icon: "plus", auth: true },
      { href: "/account/messages", label: "المحادثات", icon: "chat", badge: "messages", auth: true },
      { href: "/account/offers?type=price", label: "عروض الأسعار", icon: "tag", badge: "offers", auth: true },
      { href: "/account/offers?type=swap", label: "عروض البدل", icon: "swap", auth: true },
      { href: "/account/favorites", label: "المفضلة", icon: "heart", auth: true },
      { href: "/account/notifications", label: "الإشعارات", icon: "bell", badge: "notifications", auth: true },
      { href: "/account/settings", label: "الإعدادات", icon: "settings", auth: true },
    ],
  },
  {
    id: "trust",
    title: "الثقة والدعم",
    items: [
      { href: "/verification", label: "الفحص والتوثيق", icon: "shield" },
      { href: "/how-it-works", label: "كيف يعمل سواب", icon: "info" },
      { href: "/safety", label: "نصائح الأمان", icon: "lifebuoy" },
      { href: "/help", label: "مركز المساعدة", icon: "help" },
      { href: "/contact", label: "تواصل معنا", icon: "mail" },
    ],
  },
  {
    id: "platform",
    title: "المنصة",
    items: [
      { href: "/about", label: "عن سواب", icon: "building" },
      { href: "/terms", label: "الشروط والأحكام", icon: "file" },
      { href: "/privacy", label: "سياسة الخصوصية", icon: "lock" },
    ],
  },
];

/** Category bar order with short marketplace labels. */
export const CATEGORY_BAR: { slug: string; label: string }[] = [
  { slug: "pcs", label: "تجميعات PC" },
  { slug: "laptops", label: "لابتوبات" },
  { slug: "gpus", label: "كروت شاشة" },
  { slug: "cpus", label: "معالجات" },
  { slug: "motherboards", label: "لوحات أم" },
  { slug: "ram", label: "رامات" },
  { slug: "storage", label: "تخزين" },
  { slug: "monitors", label: "شاشات" },
  { slug: "peripherals", label: "ملحقات" },
  { slug: "consoles", label: "أجهزة ألعاب" },
];

/**
 * How well `href` matches the current location. -1 = no match.
 * Exact path + all of the href's query params present scores highest, so
 * "/browse?swap=1" beats "/browse" when ?swap=1 is set.
 */
export function navMatchScore(href: string, pathname: string, search: URLSearchParams): number {
  const u = new URL(href, "http://x");
  const params = [...u.searchParams.entries()];
  const paramsMatch = params.every(([k, v]) => search.get(k) === v);
  if (u.pathname === pathname) {
    if (!paramsMatch) return -1;
    // A bare "/browse" should not light up when a specific browse mode is active.
    if (params.length === 0 && ["swap", "verified", "sort", "type"].some((k) => search.has(k))) return 10;
    return 100 + params.length * 10;
  }
  if (u.pathname !== "/" && pathname.startsWith(u.pathname + "/") && params.length === 0) return 50 + u.pathname.length;
  return -1;
}

export function activeNavHref(hrefs: string[], pathname: string, search: URLSearchParams): string | null {
  let best: string | null = null;
  let score = -1;
  for (const h of hrefs) {
    const s = navMatchScore(h, pathname, search);
    if (s > score) {
      score = s;
      best = h;
    }
  }
  return score >= 0 ? best : null;
}
