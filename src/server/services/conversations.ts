import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, listings, messages, profiles } from "@/lib/db/schema";

/** Find or create the buyer↔seller thread for a listing. */
export async function ensureConversation(listingId: string, buyerId: string) {
  const [listing] = await db
    .select({ id: listings.id, sellerId: listings.sellerId, status: listings.status, title: listings.title })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing) return { error: "الإعلان غير موجود" } as const;
  if (listing.sellerId === buyerId) return { error: "هذا إعلانك 🙂" } as const;
  if (listing.status !== "active") return { error: "الإعلان غير متاح حاليًا" } as const;
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId)))
    .limit(1);
  if (existing) return { id: existing.id, listing } as const;
  const [created] = await db
    .insert(conversations)
    .values({ listingId, buyerId, sellerId: listing.sellerId })
    .onConflictDoNothing()
    .returning({ id: conversations.id });
  if (created) return { id: created.id, listing } as const;
  const [again] = await db.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId))).limit(1);
  return { id: again.id, listing } as const;
}

export async function appendMessage(conversationId: string, senderId: string | null, body: string, kind: "text" | "offer" | "system" = "text", offerId?: string) {
  const now = new Date();
  const [msg] = await db.insert(messages).values({ conversationId, senderId, body, kind, offerId, createdAt: now }).returning();
  const [c] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  const patch: Partial<typeof conversations.$inferInsert> = { lastMessageAt: now, lastMessagePreview: body.slice(0, 140) };
  if (senderId === c.buyerId) patch.buyerLastReadAt = now;
  if (senderId === c.sellerId) {
    patch.sellerLastReadAt = now;
    if (!c.sellerFirstReplyAt) patch.sellerFirstReplyAt = now;
  }
  await db.update(conversations).set(patch).where(eq(conversations.id, conversationId));
  return { msg, conversation: c };
}

export async function senderName(userId: string) {
  const [p] = await db.select({ n: profiles.displayName }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return p?.n ?? "مستخدم";
}

