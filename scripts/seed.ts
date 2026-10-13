/* Demo seed — idempotent-ish: run on an empty, migrated database (pnpm db:reset). */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { CATEGORY_SEED } from "../src/lib/catalog/categories";
import { toAttributeRows, specValidator } from "../src/lib/catalog/helpers";
import { hashPassword } from "../src/lib/auth/password";
import * as s from "../src/lib/db/schema";
import { listingSlug } from "../src/lib/slug";
import { SEED_LISTINGS } from "../src/lib/sample-data/listings";
import { SEED_USERS } from "./seed-data/users";

const url = process.env.DATABASE_URL ?? "postgres://swap:swap@127.0.0.1:5432/swap";
// Demo data has publicly documented passwords: only ever seed local/CI databases.
const host = new URL(url).hostname;
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo data with NODE_ENV=production");
if (!["localhost", "127.0.0.1", "::1"].includes(host) && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error(`Refusing to seed demo accounts into non-local database host "${host}". Set ALLOW_DEMO_SEED=true for a private staging DB.`);
}
const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema: s, casing: "snake_case" });

const daysAgo = (d: number, hours = 0) => new Date(Date.now() - d * 864e5 - hours * 36e5);

async function main() {
  // ── categories
  const catIds = new Map<string, { id: number; schemaKey: string }>();
  let order = 0;
  for (const c of CATEGORY_SEED) {
    const [row] = await db.insert(s.categories).values({
      slug: c.slug, nameAr: c.nameAr, nameEn: c.nameEn, descriptionAr: c.descriptionAr, icon: c.icon,
      schemaKey: c.schemaKey, featured: c.featured ?? false, sortOrder: order++,
    }).returning();
    catIds.set(c.slug, { id: row.id, schemaKey: c.schemaKey });
    let childOrder = 0;
    for (const ch of c.children ?? []) {
      const [child] = await db.insert(s.categories).values({
        slug: ch.slug, nameAr: ch.nameAr, nameEn: ch.nameEn, icon: c.icon, schemaKey: c.schemaKey, parentId: row.id, sortOrder: childOrder++,
      }).returning();
      catIds.set(ch.slug, { id: child.id, schemaKey: c.schemaKey });
    }
  }
  console.log(`✓ ${catIds.size} categories`);

  // ── users
  const userIds = new Map<string, string>();
  for (const u of SEED_USERS) {
    const [row] = await db.insert(s.users).values({
      email: u.email, passwordHash: await hashPassword(u.password), role: u.role ?? "user", trusted: u.trusted ?? false,
      emailVerifiedAt: daysAgo(u.joinedDaysAgo), createdAt: daysAgo(u.joinedDaysAgo), lastSeenAt: daysAgo(0, Math.random() * 20),
    }).returning();
    await db.insert(s.profiles).values({
      userId: row.id, username: u.username, displayName: u.displayName, city: u.city, bio: u.bio,
      responseRate: u.responseRate, responseTimeMinutes: u.responseTimeMinutes, completedDeals: u.completedDeals ?? 0,
      showPhone: u.showPhone ?? false, phone: u.phone, onboardedAt: daysAgo(u.joinedDaysAgo), createdAt: daysAgo(u.joinedDaysAgo),
    });
    userIds.set(u.key, row.id);
  }
  console.log(`✓ ${userIds.size} users`);

  // ── listings
  const listingIds = new Map<number, string>();
  const reviewer = userIds.get("mod")!;
  for (const [i, l] of SEED_LISTINGS.entries()) {
    const cat = catIds.get(l.category)!;
    const sellerId = userIds.get(l.seller)!;
    const seller = SEED_USERS.find((u) => u.key === l.seller)!;
    const specs = specValidator(cat.schemaKey).parse(l.specs);
    const created = daysAgo(l.daysAgo, i % 7);
    const status = l.status ?? "active";
    const level = l.inspection && (l.inspection.status ?? "approved") === "approved" ? l.inspection.level : "unverified";
    const cover = `/seed/${l.images[0]}.svg`;
    const [row] = await db.insert(s.listings).values({
      slug: listingSlug(l.title), sellerId, categoryId: cat.id, subcategoryId: l.sub ? catIds.get(l.sub)!.id : null,
      title: l.title, description: l.description, price: l.price * 100, isNegotiable: l.negotiable ?? true,
      acceptsSwap: l.swap ?? false, swapDetails: l.swapDetails, condition: l.condition, city: l.city ?? seller.city,
      specs: specs as Record<string, string | number | boolean>, tags: l.tags ?? [], status, verificationLevel: level, coverImageUrl: cover,
      viewCount: l.views ?? 0, publishedAt: status === "pending_review" ? null : created, soldAt: status === "sold" ? daysAgo(Math.max(0, l.daysAgo - 3)) : null,
      bumpedAt: created, createdAt: created,
    }).returning();
    listingIds.set(i, row.id);
    await db.insert(s.listingImages).values(l.images.map((img, position) => ({ listingId: row.id, url: `/seed/${img}.svg`, width: 800, height: 600, position, alt: l.title })));
    const attrs = toAttributeRows(cat.schemaKey, specs);
    if (attrs.length) await db.insert(s.listingAttributes).values(attrs.map((a) => ({ listingId: row.id, ...a })));
    if (l.oldPrice) await db.insert(s.listingPriceHistory).values({ listingId: row.id, oldPrice: l.oldPrice * 100, newPrice: l.price * 100, createdAt: daysAgo(0, 5) });

    if (l.inspection) {
      const ins = l.inspection;
      const st = ins.status ?? "approved";
      const [insp] = await db.insert(s.inspections).values({
        listingId: row.id, submittedById: sellerId, source: ins.source, status: st, requestedLevel: ins.level,
        grantedLevel: st === "approved" ? ins.level : null, partnerName: ins.partnerName, verificationCode: `SW-${Math.floor(1000 + Math.random() * 9000)}`, inspectedAt: daysAgo(ins.daysAgo, 3),
        submittedAt: daysAgo(ins.daysAgo, 2), reviewedAt: st === "approved" ? daysAgo(ins.daysAgo) : null,
        reviewerId: st === "approved" ? reviewer : null,
      }).returning();
      const r = ins.report;
      await db.insert(s.inspectionReports).values({
        inspectionId: insp.id, cpuModel: r.cpuModel, gpuModel: r.gpuModel, motherboard: r.motherboard, ramCapacityGb: r.ramCapacityGb, ramSpeedMhz: r.ramSpeedMhz,
        storage: r.storage ?? [], temperatures: r.temperatures ?? {}, batteryHealthPct: r.batteryHealthPct, batteryCycles: r.batteryCycles,
        screenNotes: r.screenNotes, portsNotes: r.portsNotes, os: r.os, benchmarks: r.benchmarks ?? [], stressTest: r.stressTest ?? {},
        checklist: Object.entries(r.checklist ?? {}).map(([key, ok]) => ({ key, ok })), summary: r.summary,
        agentVersion: ins.source === "platform_tool" ? "swap-inspect 0.9.2 (preview)" : null,
        checksum: ins.source === "platform_tool" ? "sha256:" + Buffer.from(insp.id).toString("hex").slice(0, 48) : null,
      });
      await db.insert(s.inspectionAttachments).values([
        { inspectionId: insp.id, url: `/seed/${l.images[0]}.svg`, label: "صورة الجهاز أثناء الفحص" },
        { inspectionId: insp.id, url: `/seed/${l.images[l.images.length - 1]}.svg`, label: "لقطة نتائج الأداة" },
      ]);
      if (st === "approved") {
        await db.insert(s.verificationStatuses).values({ listingId: row.id, level: ins.level, inspectionId: insp.id, changedById: reviewer, reason: "اعتماد تقرير الفحص", createdAt: daysAgo(ins.daysAgo) });
      }
    }
  }
  console.log(`✓ ${listingIds.size} listings`);

  // ── favorites, conversations, offers, notifications for the demo account
  const demo = userIds.get("demo")!;
  const L = (i: number) => listingIds.get(i)!;
  const sellerOf = (i: number) => userIds.get(SEED_LISTINGS[i].seller)!;
  const price = (i: number) => SEED_LISTINGS[i].price * 100;

  for (const i of [0, 1, 3, 6, 10]) {
    await db.insert(s.favorites).values({ userId: demo, listingId: L(i), priceAtSave: i === 0 ? 280000 : price(i) });
  }
  for (const [i, n] of [[0, 14], [1, 22], [3, 9], [6, 17], [10, 31]] as const) {
    await db.update(s.listings).set({ favoriteCount: n }).where(eq(s.listings.id, L(i)));
  }

  // Conversation 1: demo asks about the 4070 Super; price offer pending
  const [c1] = await db.insert(s.conversations).values({ listingId: L(0), buyerId: demo, sellerId: sellerOf(0), lastMessageAt: daysAgo(0, 1), sellerFirstReplyAt: daysAgo(0, 3) }).returning();
  const m = (conversationId: string, senderId: string | null, body: string, at: Date, kind: "text" | "offer" | "system" = "text", offerId?: string) =>
    db.insert(s.messages).values({ conversationId, senderId, body, createdAt: at, kind, offerId });
  await m(c1.id, demo, "السلام عليكم، الكرت لسا متوفر؟", daysAgo(0, 4));
  await m(c1.id, sellerOf(0), "وعليكم السلام، إيه متوفر ولله الحمد.", daysAgo(0, 3));
  await m(c1.id, demo, "ممتاز. ممكن أشوفه يشتغل قبل الشراء؟ وهل الفاتورة باسمك؟", daysAgo(0, 2.5));
  await m(c1.id, sellerOf(0), "أكيد، تقدر تجي وأشغله قدامك على جهازي، والفاتورة باسمي من جرير.", daysAgo(0, 2));
  const [o1] = await db.insert(s.offers).values({ listingId: L(0), conversationId: c1.id, buyerId: demo, sellerId: sellerOf(0), type: "price", amount: 250000, note: "إذا مناسب لك أجيك اليوم بعد العصر.", createdAt: daysAgo(0, 1), expiresAt: daysAgo(-3) }).returning();
  await m(c1.id, demo, "عرض سعر: 2,500 ر.س", daysAgo(0, 1), "offer", o1.id);
  await db.update(s.conversations).set({ lastMessagePreview: "عرض سعر: 2,500 ر.س", buyerLastReadAt: daysAgo(0, 1) }).where(eq(s.conversations.id, c1.id));

  // Conversation 2: demo proposes a swap for the MacBook (pending)
  const [c2] = await db.insert(s.conversations).values({ listingId: L(2), buyerId: demo, sellerId: sellerOf(2), lastMessageAt: daysAgo(0, 6), lastMessagePreview: "اقتراح بدل: Lenovo Legion 5 Pro" }).returning();
  await m(c2.id, demo, "هلا ريم، شفت إنك تفكرين ببدل بلابتوب قيمنق، عندي عرض.", daysAgo(0, 7));
  const [o2] = await db.insert(s.offers).values({ listingId: L(2), conversationId: c2.id, buyerId: demo, sellerId: sellerOf(2), type: "swap", note: "الجهاز نظيف وأقدر أرسل لك صور وتقرير فحص.", createdAt: daysAgo(0, 6), expiresAt: daysAgo(-5) }).returning();
  await db.insert(s.swapOffers).values({ offerId: o2.id, offeredTitle: "Lenovo Legion 5 Pro — RTX 4070، i7-13700HX، 32GB", offeredCategoryId: catIds.get("laptops")!.id, offeredCondition: "excellent", offeredDescription: "شاشة 16 إنش 240Hz، بطارية 89%، معه الشاحن والكرتون.", cashDirection: "buyer_pays", cashAmount: 50000 });
  await m(c2.id, demo, "اقتراح بدل: Lenovo Legion 5 Pro", daysAgo(0, 6), "offer", o2.id);

  // Conversation 3: someone asks the demo user about their 3070 Ti, with a swap offer to the demo
  const nawaf = userIds.get("nawaf")!;
  const demoGpu = SEED_LISTINGS.findIndex((x) => x.seller === "demo" && x.category === "gpus");
  const [c3] = await db.insert(s.conversations).values({ listingId: L(demoGpu), buyerId: nawaf, sellerId: demo, lastMessageAt: daysAgo(0, 0.5), lastMessagePreview: "اقتراح بدل: RX 6700 XT Sapphire Pulse" }).returning();
  await m(c3.id, nawaf, "السلام عليكم، وش آخر سعر للكرت؟", daysAgo(0, 1));
  const [o3] = await db.insert(s.offers).values({ listingId: L(demoGpu), conversationId: c3.id, buyerId: nawaf, sellerId: demo, type: "swap", note: "كرتي معروض في سواب وتقدر تشوف تفاصيله.", createdAt: daysAgo(0, 0.5), expiresAt: daysAgo(-5) }).returning();
  await db.insert(s.swapOffers).values({ offerId: o3.id, offeredTitle: "RX 6700 XT Sapphire Pulse 12GB", offeredCategoryId: catIds.get("gpus")!.id, offeredCondition: "good", offeredListingId: L(4), cashDirection: "buyer_pays", cashAmount: 15000 });
  await m(c3.id, nawaf, "اقتراح بدل: RX 6700 XT Sapphire Pulse", daysAgo(0, 0.5), "offer", o3.id);

  await db.insert(s.notifications).values([
    { userId: demo, type: "offer", title: "عرض بدل جديد على RTX 3070 Ti", body: "نواف الشمري يقترح RX 6700 XT مع 150 ر.س فرق.", href: `/account/messages/${c3.id}`, createdAt: daysAgo(0, 0.5) },
    { userId: demo, type: "price_drop", title: "انخفض سعر إعلان في مفضلتك", body: "RTX 4070 Super من ASUS Dual صار 2,650 ر.س بدل 2,800 ر.س.", href: `/account/favorites`, createdAt: daysAgo(0, 5) },
    { userId: demo, type: "message", title: "رد جديد من عبدالله الحربي", body: "أكيد، تقدر تجي وأشغله قدامك على جهازي…", href: `/account/messages/${c1.id}`, createdAt: daysAgo(0, 2), readAt: daysAgo(0, 1) },
    { userId: demo, type: "listing_status", title: "إعلانك قيد المراجعة", body: "سنراجع «رامات Corsair Vengeance DDR4» خلال ساعات قليلة.", href: "/account/listings", createdAt: daysAgo(0, 0.2) },
    { userId: sellerOf(0), type: "offer", title: "عرض سعر جديد: 2,500 ر.س", body: "أحمد السالم قدّم عرضًا على RTX 4070 Super.", href: `/account/messages/${c1.id}`, createdAt: daysAgo(0, 1) },
  ]);

  // ── moderation queue
  await db.insert(s.abuseReports).values([
    { reporterId: demo, targetType: "listing", targetId: L(13), reason: "fake_specs", details: "يذكر في الوصف إنه استُخدم في التعدين، لكن العنوان يوحي إنه نظيف. أتمنى المراجعة.", createdAt: daysAgo(0, 9) },
    { reporterId: userIds.get("sarah")!, targetType: "user", targetId: userIds.get("yazeed")!, reason: "abuse", details: "رسائل غير لائقة بعد رفض العرض.", createdAt: daysAgo(1) },
    { reporterId: userIds.get("turki")!, targetType: "listing", targetId: L(24), reason: "duplicate", status: "resolved", resolvedById: reviewer, resolutionNote: "الإعلان ليس مكررًا. لا إجراء.", resolvedAt: daysAgo(2), createdAt: daysAgo(3) },
  ]);
  await db.insert(s.banners).values({ placement: "home_top", title: "جديد: أداة الفحص من سواب (نسخة تجريبية)", body: "افحص جهازك وأرفق تقرير موثّق بالإعلان خلال دقائق.", href: "/verification", tone: "promo" });
  await db.insert(s.adminAuditLogs).values([
    { actorId: reviewer, action: "inspection.approve", targetType: "inspection", targetId: "seed", meta: { level: "platform_checked" }, createdAt: daysAgo(2) },
    { actorId: reviewer, action: "report.resolve", targetType: "report", targetId: "seed", meta: { note: "لا إجراء" }, createdAt: daysAgo(2) },
  ]);

  // daily views for analytics
  const viewRows = [];
  for (let d = 0; d < 30; d++) {
    const day = daysAgo(d).toISOString().slice(0, 10);
    for (const [i] of SEED_LISTINGS.entries()) {
      if (SEED_LISTINGS[i].daysAgo > d) continue;
      viewRows.push({ listingId: L(i), day, views: Math.round(5 + Math.random() * 40 * (1 - d / 40)) });
    }
  }
  if (viewRows.length) await db.insert(s.listingViews).values(viewRows);

  console.log("✓ demo conversations, offers, notifications, reports");
  console.log("\nDemo accounts:\n  admin@swap.example / Admin@12345 (admin)\n  mod@swap.example / Mod@12345 (moderator)\n  demo@swap.example / Demo@12345 (user)");
}

await main();
await client.end();
