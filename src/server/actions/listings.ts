"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { listings, offers } from "@/lib/db/schema";
import { run, type Result } from "./_utils";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  sold: ["active", "hidden"],
  hidden: ["active"],
  active: ["hidden", "sold"],
};

/** Owner status changes: mark sold, hide, re-activate. Moderation statuses are admin-only. */
export async function setListingStatus(input: { listingId: string; status: "active" | "sold" | "hidden" }): Promise<Result> {
  return run(async () => {
    const user = await assertUser();
    const parsed = z.object({ listingId: z.string().uuid(), status: z.enum(["active", "sold", "hidden"]) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: "طلب غير صالح" };
    const { listingId, status } = parsed.data;
    const [l] = await db.select({ sellerId: listings.sellerId, status: listings.status, slug: listings.slug }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!l || l.sellerId !== user.id) return { ok: false, error: "الإعلان غير موجود" };
    if (!(STATUS_TRANSITIONS[status] ?? []).includes(l.status)) return { ok: false, error: "لا يمكن تغيير حالة هذا الإعلان الآن" };

    await db
      .update(listings)
      .set({ status, soldAt: status === "sold" ? new Date() : null, ...(status === "active" ? { bumpedAt: new Date() } : {}) })
      .where(eq(listings.id, listingId));
    if (status === "sold") {
      await db.update(offers).set({ status: "expired" }).where(and(eq(offers.listingId, listingId), inArray(offers.status, ["pending"])));
    }
    revalidatePath("/account/listings");
    revalidatePath(`/listing/${l.slug}`);
    const msg = { sold: "مبروك! علّمنا الإعلان كمُباع", hidden: "أخفينا الإعلان عن المتصفحين", active: "الإعلان ظاهر الآن" }[status];
    return { ok: true, message: msg };
  });
}
