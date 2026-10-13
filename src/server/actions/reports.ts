"use server";

import { and, eq, inArray } from "drizzle-orm";
import { assertUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { abuseReports } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/validation/offers";
import { run, zodFail, type Result } from "./_utils";

export async function reportContent(input: { targetType: string; targetId: string; reason: string; details?: string }): Promise<Result> {
  return run(async () => {
    const user = await assertUser({ allowSuspended: true });
    const parsed = reportSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    if (!(await rateLimit(`report:${user.id}`, 10, 3600))) return { ok: false, error: "أرسلت بلاغات كثيرة. حاول لاحقًا." };
    const d = parsed.data;
    const [dup] = await db
      .select({ id: abuseReports.id })
      .from(abuseReports)
      .where(and(eq(abuseReports.reporterId, user.id), eq(abuseReports.targetId, d.targetId), inArray(abuseReports.status, ["open", "reviewing"])))
      .limit(1);
    if (dup) return { ok: true, message: "بلاغك السابق قيد المراجعة، شكرًا لك." };
    await db.insert(abuseReports).values({ reporterId: user.id, targetType: d.targetType, targetId: d.targetId, reason: d.reason, details: d.details });
    return { ok: true, message: "وصلنا بلاغك. سيراجعه فريق سواب خلال 24 ساعة." };
  });
}
