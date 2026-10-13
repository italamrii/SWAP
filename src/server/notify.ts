import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

type NotificationType = "message" | "offer" | "offer_update" | "price_drop" | "listing_status" | "inspection" | "system";

/**
 * In-app notification. `dedupe` skips creating a new row if an unread one with the
 * same href and type exists (prevents spamming on every chat message).
 * Email/push fan-out plugs in here later.
 */
export async function notify(userId: string, n: { type: NotificationType; title: string; body?: string; href?: string; dedupe?: boolean }) {
  if (n.dedupe && n.href) {
    const [existing] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.type, n.type), eq(notifications.href, n.href), isNull(notifications.readAt)))
      .limit(1);
    if (existing) {
      await db.update(notifications).set({ title: n.title, body: n.body, createdAt: new Date() }).where(eq(notifications.id, existing.id));
      return;
    }
  }
  await db.insert(notifications).values({ userId, type: n.type, title: n.title, body: n.body, href: n.href });
}
