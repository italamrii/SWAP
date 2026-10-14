import "server-only";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { abuseReports, conversations, guardAcknowledgements, guardFlags, listingImages, listings, mediaFingerprints, possessionProofs, users, type GuardSignal } from "@/lib/db/schema";
import { dealWarnings, maxSeverity, NEAR_DUPLICATE_BITS, normalizeListingText, scanText, type Signal } from "@/lib/guard/rules";
import { notify } from "../notify";

/** Postgres: Hamming distance between two 16-hex-char fingerprints. */
const distance = (col: unknown, hex: string) => sql`bit_count(('x' || ${col})::bit(64) # ('x' || ${hex})::bit(64))`;

/* ───────────── listings ───────────── */

export type ListingCheckInput = { listingId: string; sellerId: string; title: string; description: string; price: number; imageUrls: string[]; sellerCreatedAt: Date };

/** Signals for a listing about to be saved. Pure detection; `applyListingGuard` decides the consequence. */
export async function evaluateListing(i: ListingCheckInput): Promise<Signal[]> {
  const signals: Signal[] = [];
  const add = (s: Signal) => { if (!signals.some((x) => x.code === s.code)) signals.push(s); };

  for (const s of scanText(`${i.title}\n${i.description}`)) {
    // In a listing, a prepayment demand or a phishing-shaped link is a strong signal; contact details are common and harmless.
    if (s.code === "suspicious_link" || s.code === "deposit_request") add({ ...s, severity: "high" });
  }

  const fps = i.imageUrls.length
    ? await db.select({ url: mediaFingerprints.url, dhash: mediaFingerprints.dhash }).from(mediaFingerprints).where(and(inArray(mediaFingerprints.url, i.imageUrls), eq(mediaFingerprints.ownerId, i.sellerId)))
    : [];
  for (const fp of fps) {
    const [other] = await db
      .select({ url: mediaFingerprints.url })
      .from(mediaFingerprints)
      .where(and(ne(mediaFingerprints.ownerId, i.sellerId), sql`${distance(mediaFingerprints.dhash, fp.dhash)} <= ${NEAR_DUPLICATE_BITS}`))
      .limit(1);
    if (other) add({ code: "image_reuse", severity: "high", ref: other.url });
    const [mine] = await db
      .select({ id: listings.id })
      .from(listingImages)
      .innerJoin(listings, eq(listings.id, listingImages.listingId))
      .innerJoin(mediaFingerprints, eq(mediaFingerprints.url, listingImages.url))
      .where(and(eq(listings.sellerId, i.sellerId), ne(listings.id, i.listingId), inArray(listings.status, ["active", "pending_review"]), sql`${distance(mediaFingerprints.dhash, fp.dhash)} <= ${NEAR_DUPLICATE_BITS}`))
      .limit(1);
    if (mine) add({ code: "duplicate_listing", severity: "warn", ref: mine.id });
  }

  const desc = normalizeListingText(i.description);
  if (desc.length >= 60) {
    const [copied] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(and(ne(listings.sellerId, i.sellerId), inArray(listings.status, ["active", "pending_review", "sold"]), sql`lower(regexp_replace(${listings.description}, '\\s+', ' ', 'g')) = lower(regexp_replace(${i.description}, '\\s+', ' ', 'g'))`))
      .limit(1);
    if (copied) add({ code: "copied_text", severity: "high", ref: copied.id });
  }

  const ageDays = (Date.now() - i.sellerCreatedAt.getTime()) / 864e5;
  if (ageDays < 3 && i.price >= 3000 * 100) add({ code: "new_account_high_value", severity: "warn" });
  return signals;
}

const HOLDING = new Set(["image_reuse", "copied_text", "suspicious_link", "deposit_request", "duplicate_listing", "new_account_high_value", "multiple_reports"]);
const NEEDS_PROOF = new Set(["image_reuse", "copied_text", "new_account_high_value"]);

export function newProofCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = crypto.getRandomValues(new Uint8Array(5));
  return `SG-${Array.from(rand, (b) => alphabet[b % alphabet.length]).join("")}`;
}

/**
 * Persist the outcome. Returns true when the listing must stay in review: holding signals are
 * evidence-backed or need a moderator, so neither "trusted" status nor editing bypasses them.
 */
export async function applyListingGuard(listingId: string, sellerId: string, signals: Signal[]): Promise<boolean> {
  const holding = signals.filter((s) => HOLDING.has(s.code));
  const [open] = await db.select().from(guardFlags).where(and(eq(guardFlags.subjectType, "listing"), eq(guardFlags.subjectId, listingId), eq(guardFlags.status, "open"), eq(guardFlags.holding, true))).limit(1);
  if (!holding.length) return !!open;

  const severity = maxSeverity(holding)!;
  if (open) {
    const merged = [...open.signals.filter((s) => !holding.some((h) => h.code === s.code)), ...holding];
    await db.update(guardFlags).set({ signals: merged, severity: maxSeverity(merged)! }).where(eq(guardFlags.id, open.id));
  } else {
    await db.insert(guardFlags).values({ subjectType: "listing", subjectId: listingId, userId: sellerId, severity, signals: holding, holding: true });
  }
  const proofReason = holding.find((s) => NEEDS_PROOF.has(s.code));
  if (proofReason) {
    const [pending] = await db.select({ id: possessionProofs.id }).from(possessionProofs).where(and(eq(possessionProofs.listingId, listingId), inArray(possessionProofs.status, ["requested", "submitted"]))).limit(1);
    if (!pending) await db.insert(possessionProofs).values({ listingId, userId: sellerId, code: newProofCode(), reason: proofReason.code });
  }
  await notify(sellerId, {
    type: "listing_status",
    title: "إعلانك قيد مراجعة SWAP Guard",
    body: proofReason ? "نحتاج صورة إثبات حيازة بكود لمرة واحدة قبل النشر. افتح الإعلان من «إعلاناتي»." : "رصدنا مؤشرات تحتاج مراجعة فريقنا قبل النشر. يمكنك تقديم اعتراض.",
    href: `/account/listings/${listingId}/guard`,
    dedupe: true,
  });
  return true;
}

export async function hasHoldingFlag(listingId: string) {
  const [f] = await db.select({ id: guardFlags.id }).from(guardFlags).where(and(eq(guardFlags.subjectType, "listing"), eq(guardFlags.subjectId, listingId), eq(guardFlags.status, "open"), eq(guardFlags.holding, true))).limit(1);
  return !!f;
}

/** Inspection evidence that matches another account's upload is flagged for the reviewing moderator. */
export async function checkEvidenceReuse(inspectionId: string, ownerId: string, urls: string[]) {
  if (!urls.length) return;
  const fps = await db.select({ dhash: mediaFingerprints.dhash }).from(mediaFingerprints).where(and(inArray(mediaFingerprints.url, urls), eq(mediaFingerprints.ownerId, ownerId)));
  for (const fp of fps) {
    const [other] = await db.select({ url: mediaFingerprints.url }).from(mediaFingerprints).where(and(ne(mediaFingerprints.ownerId, ownerId), sql`${distance(mediaFingerprints.dhash, fp.dhash)} <= ${NEAR_DUPLICATE_BITS}`)).limit(1);
    if (other) {
      await db.insert(guardFlags).values({ subjectType: "inspection", subjectId: inspectionId, userId: ownerId, severity: "high", signals: [{ code: "evidence_reuse", severity: "high", ref: other.url }] });
      return;
    }
  }
}

/** Several verified accounts reporting fraud on the same listing holds it for moderation. */
export async function onListingReported(listingId: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(distinct ${abuseReports.reporterId})::int` })
    .from(abuseReports)
    .innerJoin(users, eq(users.id, abuseReports.reporterId))
    .where(and(eq(abuseReports.targetType, "listing"), eq(abuseReports.targetId, listingId), inArray(abuseReports.status, ["open", "reviewing"]), inArray(abuseReports.reason, ["scam", "stolen", "fake_specs"]), sql`${users.phoneVerifiedAt} is not null`));
  if (n < 3) return;
  const [l] = await db.select({ sellerId: listings.sellerId, status: listings.status }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!l || l.status !== "active") return;
  await applyListingGuard(listingId, l.sellerId, [{ code: "multiple_reports", severity: "high" }]);
  await db.update(listings).set({ status: "pending_review", moderationNote: "قيد مراجعة SWAP Guard" }).where(eq(listings.id, listingId));
}

/* ───────────── buyers: context before dealing ───────────── */

export async function listingDealWarnings(listingId: string): Promise<Signal[]> {
  const [row] = await db.execute<{ seller_created: Date; price: number; category_id: number; subcategory_id: number | null; reports: number }>(sql`
    select u.created_at as seller_created, l.price, l.category_id, l.subcategory_id,
      (select count(*)::int from reports_abuse r where r.target_type = 'listing' and r.target_id = l.id and r.status in ('open','reviewing')) as reports
    from listings l join users u on u.id = l.seller_id where l.id = ${listingId}`);
  if (!row) return [];
  const [m] = await db.execute<{ median: number | null; n: number }>(sql`
    select percentile_cont(0.5) within group (order by price) as median, count(*)::int as n
    from listings where status = 'active' and id <> ${listingId} and
      ${row.subcategory_id ? sql`subcategory_id = ${row.subcategory_id}` : sql`category_id = ${row.category_id}`}`);
  return dealWarnings({
    sellerAccountAgeDays: (Date.now() - new Date(row.seller_created).getTime()) / 864e5,
    openReports: row.reports,
    price: row.price,
    categoryMedian: m?.median ?? null,
    categorySample: m?.n ?? 0,
  });
}

/* ───────────── acknowledgements ───────────── */

export async function acknowledgedCodes(userId: string, subjectType: string, subjectId: string) {
  const rows = await db.select({ codes: guardAcknowledgements.codes }).from(guardAcknowledgements).where(and(eq(guardAcknowledgements.userId, userId), eq(guardAcknowledgements.subjectType, subjectType), eq(guardAcknowledgements.subjectId, subjectId)));
  return new Set(rows.flatMap((r) => r.codes));
}

export async function acknowledge(userId: string, subjectType: string, subjectId: string, codes: string[]) {
  if (codes.length) await db.insert(guardAcknowledgements).values({ userId, subjectType, subjectId, codes });
}

/** Warning codes the user has not yet acknowledged for this subject. */
export async function unacknowledged(userId: string, subjectType: string, subjectId: string, signals: Signal[]) {
  const seen = await acknowledgedCodes(userId, subjectType, subjectId);
  return [...new Set(signals.filter((s) => s.severity !== "info").map((s) => s.code))].filter((c) => !seen.has(c));
}

/* ───────────── messaging ───────────── */

/** Codes carried by the *other* party's messages in a conversation — what the viewer should be warned about. */
export async function conversationSignals(conversationId: string, viewerId: string): Promise<Signal[]> {
  const rows = await db.execute<{ code: string }>(sql`
    select distinct unnest(guard_codes) as code from messages
    where conversation_id = ${conversationId} and sender_id is distinct from ${viewerId} and cardinality(guard_codes) > 0`);
  return rows.map((r) => ({ code: r.code, severity: r.code === "suspicious_link" || r.code === "repeated_deposit" ? "high" : "warn" }) as Signal);
}

export type MessageVerdict = { codes: string[]; senderWarnings: string[]; block?: string };

const BROADCAST_THRESHOLD = 3;
const NEW_CONVERSATIONS_PER_HOUR = 15;

/** Check a message before it is stored. Blocks only abusive *behaviour*; content signals become warnings. */
export async function evaluateMessage(senderId: string, conversationId: string | null, body: string): Promise<MessageVerdict> {
  const signals = scanText(body);
  const codes = signals.map((s) => s.code);
  const trimmed = body.trim();

  if (trimmed.length >= 20) {
    const [{ n }] = await db.execute<{ n: number }>(sql`
      select count(distinct conversation_id)::int as n from messages
      where sender_id = ${senderId} and body = ${trimmed} and created_at > now() - interval '1 hour'
        ${conversationId ? sql`and conversation_id <> ${conversationId}` : sql``}`);
    if (n >= BROADCAST_THRESHOLD) {
      await flagUser(senderId, [{ code: "duplicate_broadcast", severity: "high" }]);
      return { codes, senderWarnings: [], block: "أرسلت الرسالة نفسها لعدد كبير من المستخدمين. اكتب رسالة خاصة لكل محادثة." };
    }
  }

  if (codes.includes("deposit_request")) {
    const [{ n }] = await db.execute<{ n: number }>(sql`
      select count(distinct conversation_id)::int as n from messages
      where sender_id = ${senderId} and 'deposit_request' = any(guard_codes) and created_at > now() - interval '1 day'
        ${conversationId ? sql`and conversation_id <> ${conversationId}` : sql``}`);
    if (n >= 2) {
      codes.push("repeated_deposit");
      await flagUser(senderId, [{ code: "repeated_deposit", severity: "high" }]);
    }
  }
  if (codes.includes("suspicious_link")) await flagUser(senderId, [{ code: "suspicious_link", severity: "high" }]);

  return { codes, senderWarnings: signals.filter((s) => s.severity !== "info").map((s) => s.code) };
}

export async function tooManyNewConversations(buyerId: string) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(conversations).where(and(eq(conversations.buyerId, buyerId), sql`${conversations.createdAt} > now() - interval '1 hour'`));
  return n >= NEW_CONVERSATIONS_PER_HOUR;
}

/** One open user-level flag per account; new signals are merged into it. */
async function flagUser(userId: string, signals: GuardSignal[]) {
  const [open] = await db.select().from(guardFlags).where(and(eq(guardFlags.subjectType, "user"), eq(guardFlags.subjectId, userId), eq(guardFlags.status, "open"))).limit(1);
  if (open) {
    const merged = [...open.signals.filter((s) => !signals.some((n) => n.code === s.code)), ...signals];
    await db.update(guardFlags).set({ signals: merged, severity: maxSeverity(merged)! }).where(eq(guardFlags.id, open.id));
  } else {
    await db.insert(guardFlags).values({ subjectType: "user", subjectId: userId, userId, severity: maxSeverity(signals)!, signals });
  }
}

