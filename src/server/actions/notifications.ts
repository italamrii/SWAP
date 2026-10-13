"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

export async function markAllNotificationsRead() {
  const user = await assertUser({ allowSuspended: true });
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/account", "layout");
}
