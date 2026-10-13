import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ───────────────────────────── enums ───────────────────────────── */

export const userRole = pgEnum("user_role", ["user", "moderator", "admin"]);
export const userStatus = pgEnum("user_status", ["active", "suspended", "banned"]);
export const listingStatus = pgEnum("listing_status", ["draft", "pending_review", "active", "sold", "hidden", "rejected"]);
export const listingCondition = pgEnum("listing_condition", ["new", "like_new", "excellent", "good", "fair", "for_parts"]);
export const verificationLevel = pgEnum("verification_level", ["unverified", "seller_report", "platform_checked", "partner_verified"]);
export const offerType = pgEnum("offer_type", ["price", "swap"]);
export const offerStatus = pgEnum("offer_status", ["pending", "accepted", "rejected", "withdrawn", "expired"]);
export const cashDirection = pgEnum("cash_direction", ["none", "buyer_pays", "seller_pays"]);
export const messageKind = pgEnum("message_kind", ["text", "offer", "system"]);
export const inspectionSource = pgEnum("inspection_source", ["manual", "platform_tool", "store_partner"]);
export const inspectionStatus = pgEnum("inspection_status", ["draft", "submitted", "approved", "rejected", "superseded"]);
export const reportTarget = pgEnum("report_target", ["listing", "user", "message"]);
export const reportReason = pgEnum("report_reason", ["scam", "fake_specs", "stolen", "prohibited", "duplicate", "abuse", "wrong_category", "other"]);
export const reportStatus = pgEnum("report_status", ["open", "reviewing", "resolved", "dismissed"]);

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

/* ───────────────────────────── identity ───────────────────────────── */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("user"),
  status: userStatus("status").notNull().default("active"),
  /** Trusted sellers publish without the review queue. */
  trusted: boolean("trusted").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)]);

export const sessions = pgTable("sessions", {
  /** sha256 of the cookie token — the raw token is never stored. */
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(), // sha256 of token
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  city: text("city"),
  phone: text("phone"),
  showPhone: boolean("show_phone").notNull().default(false),
  locale: text("locale").notNull().default("ar"),
  notifyEmail: boolean("notify_email").notNull().default(true),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  /** Cached trust metrics, refreshed by background jobs / on write. */
  responseRate: smallint("response_rate"),
  responseTimeMinutes: integer("response_time_minutes"),
  completedDeals: integer("completed_deals").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("profiles_username_uq").on(sql`lower(${t.username})`)]);

/* ───────────────────────────── catalog ───────────────────────────── */

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id"),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar"),
  icon: text("icon").notNull().default("accessory"),
  /** Key into SPEC_SCHEMAS (code). Children inherit the parent's schema. */
  schemaKey: text("schema_key").notNull(),
  featured: boolean("featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("categories_parent_idx").on(t.parentId)]);

/* ───────────────────────────── listings ───────────────────────────── */

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Human-friendly URL: "<transliterated-title>-<shortId>" */
  slug: text("slug").notNull().unique(),
  sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => categories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  /** Price in halalas (1 SAR = 100). */
  price: integer("price").notNull(),
  isNegotiable: boolean("is_negotiable").notNull().default(true),
  acceptsSwap: boolean("accepts_swap").notNull().default(false),
  swapDetails: text("swap_details"),
  condition: listingCondition("condition").notNull(),
  city: text("city").notNull(),
  district: text("district"),
  specs: jsonb("specs").$type<Record<string, string | number | boolean>>().notNull().default({}),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  status: listingStatus("status").notNull().default("pending_review"),
  moderationNote: text("moderation_note"),
  verificationLevel: verificationLevel("verification_level").notNull().default("unverified"),
  coverImageUrl: text("cover_image_url"),
  viewCount: integer("view_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  soldAt: timestamp("sold_at", { withTimezone: true }),
  bumpedAt: timestamp("bumped_at", { withTimezone: true }).notNull().defaultNow(),
  searchVector: tsvector("search_vector").generatedAlwaysAs(
    sql`setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A') || setweight(to_tsvector('simple'::regconfig, coalesce(description, '')), 'C')`,
  ),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index("listings_browse_idx").on(t.status, t.categoryId, t.bumpedAt),
  index("listings_seller_idx").on(t.sellerId, t.status),
  index("listings_city_idx").on(t.city),
  index("listings_price_idx").on(t.price),
  index("listings_search_idx").using("gin", t.searchVector),
  index("listings_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
]);

export const listingImages = pgTable("listing_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  position: smallint("position").notNull().default(0),
  alt: text("alt"),
  createdAt: createdAt(),
}, (t) => [index("listing_images_listing_idx").on(t.listingId, t.position)]);

/** Normalized, indexed copy of filterable specs. Rebuilt on every listing save. */
export const listingAttributes = pgTable("listing_attributes", {
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  valueText: text("value_text"),
  valueNum: doublePrecision("value_num"),
}, (t) => [
  primaryKey({ columns: [t.listingId, t.key] }),
  index("listing_attr_text_idx").on(t.key, t.valueText),
  index("listing_attr_num_idx").on(t.key, t.valueNum),
]);

export const listingPriceHistory = pgTable("listing_price_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  oldPrice: integer("old_price").notNull(),
  newPrice: integer("new_price").notNull(),
  createdAt: createdAt(),
}, (t) => [index("price_history_listing_idx").on(t.listingId)]);

export const listingViews = pgTable("listing_daily_views", {
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  day: text("day").notNull(), // YYYY-MM-DD
  views: integer("views").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.listingId, t.day] })]);

export const favorites = pgTable("favorites", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  priceAtSave: integer("price_at_save").notNull(),
  notifyPriceDrop: boolean("notify_price_drop").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.listingId] }), index("favorites_listing_idx").on(t.listingId)]);

/* ───────────────────────────── messaging & offers ───────────────────────────── */

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  lastMessagePreview: text("last_message_preview"),
  buyerLastReadAt: timestamp("buyer_last_read_at", { withTimezone: true }),
  sellerLastReadAt: timestamp("seller_last_read_at", { withTimezone: true }),
  /** When the seller first replied — feeds response-rate metrics. */
  sellerFirstReplyAt: timestamp("seller_first_reply_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("conversations_listing_buyer_uq").on(t.listingId, t.buyerId),
  index("conversations_buyer_idx").on(t.buyerId, t.lastMessageAt),
  index("conversations_seller_idx").on(t.sellerId, t.lastMessageAt),
]);

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: offerType("type").notNull(),
  /** Price offers: offered amount (halalas). */
  amount: integer("amount"),
  note: text("note"),
  status: offerStatus("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [
  index("offers_seller_idx").on(t.sellerId, t.status),
  index("offers_buyer_idx").on(t.buyerId, t.status),
  index("offers_listing_idx").on(t.listingId),
]);

export const swapOffers = pgTable("swap_offers", {
  offerId: uuid("offer_id").primaryKey().references(() => offers.id, { onDelete: "cascade" }),
  offeredTitle: text("offered_title").notNull(),
  offeredCategoryId: integer("offered_category_id").references(() => categories.id),
  offeredCondition: listingCondition("offered_condition").notNull(),
  offeredDescription: text("offered_description"),
  /** Optional: swap against one of the buyer's own SWAP listings. */
  offeredListingId: uuid("offered_listing_id").references(() => listings.id, { onDelete: "set null" }),
  cashDirection: cashDirection("cash_direction").notNull().default("none"),
  cashAmount: integer("cash_amount").notNull().default(0),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  kind: messageKind("kind").notNull().default("text"),
  body: text("body").notNull(),
  offerId: uuid("offer_id").references(() => offers.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)]);

/* ───────────────────────────── inspection & verification ───────────────────────────── */

export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  submittedById: uuid("submitted_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: inspectionSource("source").notNull().default("manual"),
  status: inspectionStatus("status").notNull().default("draft"),
  /** Level requested by the submitter / implied by source. */
  requestedLevel: verificationLevel("requested_level").notNull().default("seller_report"),
  /** Level granted by a moderator on approval. */
  grantedLevel: verificationLevel("granted_level"),
  partnerName: text("partner_name"),
  /** One-time code the seller writes on paper and photographs next to the device (proof of possession). */
  verificationCode: text("verification_code").notNull(),
  inspectedAt: timestamp("inspected_at", { withTimezone: true }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  reviewNote: text("review_note"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("inspections_listing_idx").on(t.listingId, t.status), index("inspections_status_idx").on(t.status, t.submittedAt)]);

export type StorageDrive = { model: string; type?: string; capacityGb?: number; healthPct?: number; powerOnHours?: number };
export type Temperatures = { cpuIdle?: number; cpuLoad?: number; gpuIdle?: number; gpuLoad?: number };
export type Benchmark = { name: string; score: string; note?: string };
export type StressTest = { tool?: string; durationMin?: number; passed?: boolean; notes?: string };
export type ChecklistItem = { key: string; ok: boolean | null; note?: string };

export const inspectionReports = pgTable("inspection_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  inspectionId: uuid("inspection_id").notNull().unique().references(() => inspections.id, { onDelete: "cascade" }),
  cpuModel: text("cpu_model"),
  gpuModel: text("gpu_model"),
  motherboard: text("motherboard"),
  ramCapacityGb: integer("ram_capacity_gb"),
  ramSpeedMhz: integer("ram_speed_mhz"),
  storage: jsonb("storage").$type<StorageDrive[]>().notNull().default([]),
  temperatures: jsonb("temperatures").$type<Temperatures>().notNull().default({}),
  batteryHealthPct: smallint("battery_health_pct"),
  batteryCycles: integer("battery_cycles"),
  screenNotes: text("screen_notes"),
  portsNotes: text("ports_notes"),
  checklist: jsonb("checklist").$type<ChecklistItem[]>().notNull().default([]),
  benchmarks: jsonb("benchmarks").$type<Benchmark[]>().notNull().default([]),
  stressTest: jsonb("stress_test").$type<StressTest>().notNull().default({}),
  os: text("os"),
  summary: text("summary"),
  /** Raw machine payload from the desktop inspection agent (platform_tool). */
  rawPayload: jsonb("raw_payload"),
  agentVersion: text("agent_version"),
  /** sha256 of the canonical payload, signed by the agent. */
  checksum: text("checksum"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const inspectionAttachments = pgTable("inspection_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  inspectionId: uuid("inspection_id").notNull().references(() => inspections.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  kind: text("kind").notNull().default("image"), // image | pdf
  label: text("label"),
  createdAt: createdAt(),
}, (t) => [index("inspection_attachments_idx").on(t.inspectionId)]);

/** Append-only ledger of verification level changes per listing. */
export const verificationStatuses = pgTable("verification_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  level: verificationLevel("level").notNull(),
  inspectionId: uuid("inspection_id").references(() => inspections.id, { onDelete: "set null" }),
  changedById: uuid("changed_by_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  createdAt: createdAt(),
}, (t) => [index("verification_statuses_listing_idx").on(t.listingId, t.createdAt)]);

/* ───────────────────────────── trust & safety, ops ───────────────────────────── */

export const abuseReports = pgTable("reports_abuse", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  targetType: reportTarget("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  reason: reportReason("reason").notNull(),
  details: text("details"),
  status: reportStatus("status").notNull().default("open"),
  resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
  resolutionNote: text("resolution_note"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("reports_status_idx").on(t.status, t.createdAt), index("reports_target_idx").on(t.targetType, t.targetId)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // message | offer | offer_update | price_drop | listing_status | inspection | system
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("notifications_user_idx").on(t.userId, t.readAt, t.createdAt)]);

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("audit_created_idx").on(t.createdAt), index("audit_target_idx").on(t.targetType, t.targetId)]);

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  placement: text("placement").notNull().default("home_top"),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  tone: text("tone").notNull().default("info"), // info | promo | warning
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Inspection = typeof inspections.$inferSelect;
export type InspectionReport = typeof inspectionReports.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type SwapOffer = typeof swapOffers.$inferSelect;
