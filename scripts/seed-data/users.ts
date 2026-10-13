export interface SeedUser {
  key: string;
  email: string;
  password: string;
  role?: "user" | "moderator" | "admin";
  trusted?: boolean;
  username: string;
  displayName: string;
  city: string;
  bio?: string;
  responseRate?: number;
  responseTimeMinutes?: number;
  completedDeals?: number;
  joinedDaysAgo: number;
  showPhone?: boolean;
  phone?: string;
}

export const SEED_USERS: SeedUser[] = [
  { key: "admin", email: "admin@swap.sa", password: "Admin@12345", role: "admin", trusted: true, username: "swap", displayName: "فريق سواب", city: "riyadh", joinedDaysAgo: 400, bio: "الحساب الرسمي لفريق سواب." },
  { key: "mod", email: "mod@swap.sa", password: "Mod@12345", role: "moderator", trusted: true, username: "swap_mod", displayName: "مشرف سواب", city: "jeddah", joinedDaysAgo: 300 },
  { key: "demo", email: "demo@swap.sa", password: "Demo@12345", username: "ahmed_demo", displayName: "أحمد السالم", city: "riyadh", joinedDaysAgo: 45, bio: "أجمع قطع جهاز جديد وأبدّل اللي ما أحتاجه.", responseRate: 92, responseTimeMinutes: 25, completedDeals: 3 },
  { key: "abdullah", email: "abdullah@example.com", password: "Seller@12345", trusted: true, username: "abdullah_pc", displayName: "عبدالله الحربي", city: "riyadh", joinedDaysAgo: 520, bio: "مجمّع أجهزة من 2016. أبيع قطعي بعد الترقية، وكل قطعة أفحصها قبل العرض.", responseRate: 98, responseTimeMinutes: 12, completedDeals: 41, showPhone: true, phone: "0551234567" },
  { key: "reem", email: "reem@example.com", password: "Seller@12345", username: "reem.tech", displayName: "ريم العتيبي", city: "jeddah", joinedDaysAgo: 210, bio: "مصممة جرافيك، أبيع أجهزة العمل بعد التحديث.", responseRate: 95, responseTimeMinutes: 40, completedDeals: 9 },
  { key: "faisal", email: "faisal@example.com", password: "Seller@12345", trusted: true, username: "faisal_builds", displayName: "فيصل القحطاني", city: "dammam", joinedDaysAgo: 610, bio: "تجميعات قيمنق حسب الطلب وتبديل قطع. المنطقة الشرقية.", responseRate: 97, responseTimeMinutes: 18, completedDeals: 63 },
  { key: "nawaf", email: "nawaf@example.com", password: "Seller@12345", username: "nawaf_gg", displayName: "نواف الشمري", city: "hail", joinedDaysAgo: 120, responseRate: 81, responseTimeMinutes: 95, completedDeals: 4 },
  { key: "sarah", email: "sarah@example.com", password: "Seller@12345", username: "sarah_z", displayName: "سارة الزهراني", city: "jeddah", joinedDaysAgo: 330, bio: "طالبة هندسة حاسب.", responseRate: 90, responseTimeMinutes: 55, completedDeals: 6 },
  { key: "mohammed", email: "mohammed@example.com", password: "Seller@12345", username: "m_ghamdi", displayName: "محمد الغامدي", city: "riyadh", joinedDaysAgo: 75, responseRate: 88, responseTimeMinutes: 70, completedDeals: 2 },
  { key: "turki", email: "turki@example.com", password: "Seller@12345", trusted: true, username: "turki_setup", displayName: "تركي الدوسري", city: "khobar", joinedDaysAgo: 450, bio: "مهتم بالسيت أب والشاشات. أبيع وأبدّل.", responseRate: 96, responseTimeMinutes: 22, completedDeals: 27 },
  { key: "lama", email: "lama@example.com", password: "Seller@12345", username: "lama.s", displayName: "لمى السبيعي", city: "riyadh", joinedDaysAgo: 160, responseRate: 93, responseTimeMinutes: 35, completedDeals: 5 },
  { key: "khaled", email: "khaled@example.com", password: "Seller@12345", username: "khaled_hw", displayName: "خالد العنزي", city: "tabuk", joinedDaysAgo: 280, responseRate: 85, responseTimeMinutes: 120, completedDeals: 11 },
  { key: "yazeed", email: "yazeed@example.com", password: "Seller@12345", username: "yazeed_fps", displayName: "يزيد المطيري", city: "buraydah", joinedDaysAgo: 30, responseRate: 76, responseTimeMinutes: 140, completedDeals: 0 },
  { key: "hind", email: "hind@example.com", password: "Seller@12345", username: "hind_creates", displayName: "هند الشهري", city: "abha", joinedDaysAgo: 190, responseRate: 91, responseTimeMinutes: 48, completedDeals: 7 },
];
