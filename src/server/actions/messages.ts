"use server";

import { and, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertEligible, assertUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "../notify";
import { getMessages, type ThreadMessage } from "../queries/inbox";
import { appendMessage, ensureConversation, hasConversation, senderName } from "../services/conversations";
import { acknowledge, conversationSignals, evaluateMessage, listingDealWarnings, tooManyNewConversations, unacknowledged } from "../services/guard";
import { guardPrompt, run, zodFail, type Result } from "./_utils";

const bodySchema = z.string().trim().min(1, "اكتب رسالتك").max(2000, "الرسالة طويلة جدًا (2000 حرف كحد أقصى)");

export async function contactSeller(input: { listingId: string; body: string; ack?: boolean }): Promise<Result<{ conversationId: string }>> {
  return run(async () => {
    const user = await assertEligible();
    const parsed = z.object({ listingId: z.string().uuid(), body: bodySchema, ack: z.boolean().optional() }).safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    const { listingId, body, ack } = parsed.data;
    if (!(await rateLimit(`contact:${user.id}`, 20, 3600))) return { ok: false, error: "أرسلت رسائل كثيرة خلال وقت قصير. حاول بعد قليل." };
    if (!(await hasConversation(listingId, user.id)) && (await tooManyNewConversations(user.id)))
      return { ok: false, error: "راسلت عددًا كبيرًا من البائعين خلال ساعة. حاول لاحقًا." };
    const verdict = await evaluateMessage(user.id, null, body);
    if (verdict.block) return { ok: false, error: verdict.block };
    const pendingDeal = await unacknowledged(user.id, "listing", listingId, await listingDealWarnings(listingId));
    const pendingDraft = await unacknowledged(user.id, "message_draft", listingId, verdict.senderWarnings.map((code) => ({ code, severity: "warn" as const })));
    if ((pendingDeal.length || pendingDraft.length) && !ack) return guardPrompt([...pendingDeal, ...pendingDraft]);
    const conv = await ensureConversation(listingId, user.id);
    if ("error" in conv) return { ok: false, error: conv.error! };
    await acknowledge(user.id, "listing", listingId, pendingDeal);
    await acknowledge(user.id, "message_draft", listingId, pendingDraft);
    await appendMessage(conv.id, user.id, body, "text", undefined, verdict.codes);
    await notify(conv.listing.sellerId, {
      type: "message",
      title: `رسالة جديدة من ${await senderName(user.id)}`,
      body: `بخصوص «${conv.listing.title}»: ${parsed.data.body.slice(0, 80)}`,
      href: `/account/messages/${conv.id}`,
      dedupe: true,
    });
    revalidatePath("/account/messages");
    return { ok: true, data: { conversationId: conv.id } };
  });
}

export async function sendMessage(input: { conversationId: string; body: string; ack?: boolean }): Promise<Result<ThreadMessage>> {
  return run(async () => {
    const user = await assertEligible();
    const parsed = z.object({ conversationId: z.string().uuid(), body: bodySchema, ack: z.boolean().optional() }).safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    if (!(await rateLimit(`msg:${user.id}`, 60, 600))) return { ok: false, error: "تمهّل قليلًا، أرسلت رسائل كثيرة." };
    const [c] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, parsed.data.conversationId), or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id))))
      .limit(1);
    if (!c) return { ok: false, error: "المحادثة غير موجودة" };
    const verdict = await evaluateMessage(user.id, c.id, parsed.data.body);
    if (verdict.block) return { ok: false, error: verdict.block };
    // Warnings about the other party must be acknowledged before replying; so must warnings about your own draft.
    const pendingConv = await unacknowledged(user.id, "conversation", c.id, await conversationSignals(c.id, user.id));
    const pendingDraft = await unacknowledged(user.id, "message_draft", c.id, verdict.senderWarnings.map((code) => ({ code, severity: "warn" as const })));
    if ((pendingConv.length || pendingDraft.length) && !parsed.data.ack) return guardPrompt([...pendingConv, ...pendingDraft]);
    await acknowledge(user.id, "conversation", c.id, pendingConv);
    await acknowledge(user.id, "message_draft", c.id, pendingDraft);
    const { msg } = await appendMessage(c.id, user.id, parsed.data.body, "text", undefined, verdict.codes);
    const recipient = c.buyerId === user.id ? c.sellerId : c.buyerId;
    await notify(recipient, { type: "message", title: `رسالة جديدة من ${await senderName(user.id)}`, body: parsed.data.body.slice(0, 100), href: `/account/messages/${c.id}`, dedupe: true });
    const [full] = (await getMessages(c.id, new Date(msg.createdAt.getTime() - 1))).filter((m) => m.id === msg.id);
    return { ok: true, data: full };
  });
}

/** "I understand, continue": records the viewer's acknowledgement of the conversation's current warnings. */
export async function acknowledgeConversation(conversationId: string): Promise<Result> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    const [c] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id))))
      .limit(1);
    if (!c) return { ok: false, error: "المحادثة غير موجودة" };
    await acknowledge(user.id, "conversation", c.id, await unacknowledged(user.id, "conversation", c.id, await conversationSignals(c.id, user.id)));
    return { ok: true };
  });
}

/** Polling endpoint for the chat window: new messages + marks thread read. */
export async function fetchNewMessages(conversationId: string, afterIso: string | null): Promise<Result<ThreadMessage[]>> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    const [c] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id))))
      .limit(1);
    if (!c) return { ok: false, error: "المحادثة غير موجودة" };
    const msgs = await getMessages(conversationId, afterIso ? new Date(afterIso) : undefined);
    if (msgs.length) await markRead(conversationId);
    return { ok: true, data: msgs };
  });
}

export async function markRead(conversationId: string) {
  const user = await assertUser({ allowSuspended: true });
  const now = new Date();
  await db.update(conversations).set({ buyerLastReadAt: now }).where(and(eq(conversations.id, conversationId), eq(conversations.buyerId, user.id)));
  await db.update(conversations).set({ sellerLastReadAt: now }).where(and(eq(conversations.id, conversationId), eq(conversations.sellerId, user.id)));
  // Clear message notifications for this thread.
  await db.execute(sql`update notifications set read_at = now() where user_id = ${user.id} and href = ${`/account/messages/${conversationId}`} and read_at is null and type = 'message'`);
  return { ok: true };
}

