import "server-only";
import { and, asc, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cache } from "react";
import { db } from "@/lib/db";
import { categories, conversations, listings, messages, notifications, offers, profiles, swapOffers, users } from "@/lib/db/schema";

export const getUnreadCounts = cache(async (userId: string) => {
  const [msg] = await db.execute<{ n: number }>(sql`
    select count(distinct c.id)::int as n
    from ${conversations} c
    join ${messages} m on m.conversation_id = c.id
    where (c.buyer_id = ${userId} and m.sender_id is distinct from ${userId} and m.created_at > coalesce(c.buyer_last_read_at, 'epoch'))
       or (c.seller_id = ${userId} and m.sender_id is distinct from ${userId} and m.created_at > coalesce(c.seller_last_read_at, 'epoch'))
  `);
  const [notif] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  const [pendingOffers] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(offers)
    .where(and(eq(offers.sellerId, userId), eq(offers.status, "pending")));
  return { messages: msg?.n ?? 0, notifications: notif?.n ?? 0, offers: pendingOffers?.n ?? 0 };
});

const other = alias(profiles, "other_profile");

export async function getConversations(userId: string) {
  const rows = await db
    .select({
      id: conversations.id,
      lastMessageAt: conversations.lastMessageAt,
      preview: conversations.lastMessagePreview,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      buyerLastReadAt: conversations.buyerLastReadAt,
      sellerLastReadAt: conversations.sellerLastReadAt,
      listing: { id: listings.id, slug: listings.slug, title: listings.title, price: listings.price, coverImageUrl: listings.coverImageUrl, status: listings.status },
      otherName: other.displayName,
      otherUsername: other.username,
      otherAvatar: other.avatarUrl,
    })
    .from(conversations)
    .innerJoin(listings, eq(listings.id, conversations.listingId))
    .innerJoin(other, sql`${other.userId} = case when ${conversations.buyerId} = ${userId} then ${conversations.sellerId} else ${conversations.buyerId} end`)
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(100);

  // Unread flag: any message from the other party after my last read.
  const unread = await db.execute<{ id: string }>(sql`
    select distinct c.id from ${conversations} c join ${messages} m on m.conversation_id = c.id
    where m.sender_id is distinct from ${userId} and (
      (c.buyer_id = ${userId} and m.created_at > coalesce(c.buyer_last_read_at, 'epoch')) or
      (c.seller_id = ${userId} and m.created_at > coalesce(c.seller_last_read_at, 'epoch')))
  `);
  const unreadSet = new Set(unread.map((r) => r.id));
  return rows.map((r) => ({ ...r, role: r.buyerId === userId ? ("buyer" as const) : ("seller" as const), unread: unreadSet.has(r.id) }));
}
export type ConversationSummary = Awaited<ReturnType<typeof getConversations>>[number];

export async function getConversation(conversationId: string, userId: string) {
  const buyer = alias(profiles, "buyer_profile");
  const seller = alias(profiles, "seller_profile");
  const [c] = await db
    .select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      listing: {
        id: listings.id, slug: listings.slug, title: listings.title, price: listings.price, coverImageUrl: listings.coverImageUrl,
        status: listings.status, acceptsSwap: listings.acceptsSwap, isNegotiable: listings.isNegotiable, verificationLevel: listings.verificationLevel,
      },
      buyerName: buyer.displayName,
      buyerUsername: buyer.username,
      sellerName: seller.displayName,
      sellerUsername: seller.username,
      sellerPhone: seller.phone,
      sellerShowPhone: seller.showPhone,
    })
    .from(conversations)
    .innerJoin(listings, eq(listings.id, conversations.listingId))
    .innerJoin(buyer, eq(buyer.userId, conversations.buyerId))
    .innerJoin(seller, eq(seller.userId, conversations.sellerId))
    .where(and(eq(conversations.id, conversationId), or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId))))
    .limit(1);
  if (!c) return null;
  const msgs = await getMessages(conversationId);
  return { ...c, role: c.buyerId === userId ? ("buyer" as const) : ("seller" as const), messages: msgs };
}

export async function getMessages(conversationId: string, after?: Date) {
  const offeredCat = alias(categories, "offered_cat");
  const offeredListing = alias(listings, "offered_listing");
  return db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      kind: messages.kind,
      body: messages.body,
      createdAt: messages.createdAt,
      offer: {
        id: offers.id,
        type: offers.type,
        amount: offers.amount,
        note: offers.note,
        status: offers.status,
        buyerId: offers.buyerId,
        sellerId: offers.sellerId,
      },
      swap: {
        offeredTitle: swapOffers.offeredTitle,
        offeredCondition: swapOffers.offeredCondition,
        offeredDescription: swapOffers.offeredDescription,
        cashDirection: swapOffers.cashDirection,
        cashAmount: swapOffers.cashAmount,
        offeredCategory: offeredCat.nameAr,
        offeredListingSlug: offeredListing.slug,
      },
    })
    .from(messages)
    .leftJoin(offers, eq(offers.id, messages.offerId))
    .leftJoin(swapOffers, eq(swapOffers.offerId, offers.id))
    .leftJoin(offeredCat, eq(offeredCat.id, swapOffers.offeredCategoryId))
    .leftJoin(offeredListing, eq(offeredListing.id, swapOffers.offeredListingId))
    .where(after ? and(eq(messages.conversationId, conversationId), gt(messages.createdAt, after)) : eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(500);
}
export type ThreadMessage = Awaited<ReturnType<typeof getMessages>>[number];

export async function getOffersFor(userId: string) {
  const counterpart = alias(profiles, "cp");
  return db
    .select({
      id: offers.id,
      type: offers.type,
      amount: offers.amount,
      status: offers.status,
      note: offers.note,
      createdAt: offers.createdAt,
      conversationId: offers.conversationId,
      direction: sql<"received" | "sent">`case when ${offers.sellerId} = ${userId} then 'received' else 'sent' end`,
      listing: { slug: listings.slug, title: listings.title, price: listings.price, coverImageUrl: listings.coverImageUrl },
      swap: { offeredTitle: swapOffers.offeredTitle, cashDirection: swapOffers.cashDirection, cashAmount: swapOffers.cashAmount, offeredCondition: swapOffers.offeredCondition },
      counterpartName: counterpart.displayName,
    })
    .from(offers)
    .innerJoin(listings, eq(listings.id, offers.listingId))
    .leftJoin(swapOffers, eq(swapOffers.offerId, offers.id))
    .innerJoin(counterpart, sql`${counterpart.userId} = case when ${offers.sellerId} = ${userId} then ${offers.buyerId} else ${offers.sellerId} end`)
    .innerJoin(users, eq(users.id, counterpart.userId))
    .where(or(eq(offers.sellerId, userId), eq(offers.buyerId, userId)))
    .orderBy(desc(offers.createdAt))
    .limit(100);
}
