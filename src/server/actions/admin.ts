"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertStaff } from "@/lib/auth/guards";
import { destroyAllSessions } from "@/lib/auth/session";
import { VERIFICATION_META, type VerificationLevel } from "@/lib/catalog/verification";
import { db } from "@/lib/db";
import { abuseReports, adminAuditLogs, banners, categories, guardFlags, inspections, listings, supportTickets, users, verificationStatuses } from "@/lib/db/schema";
import { notify } from "../notify";
import { run, type Result } from "./_utils";

async function audit(actorId: string, action: string, targetType: string, targetId: string, meta: Record<string, unknown> = {}) {
  await db.insert(adminAuditLogs).values({ actorId, action, targetType, targetId, meta });
}

const uuid = z.string().uuid();

/* ───────── Listings moderation ───────── */

export async function moderateListing(input: { listingId: string; decision: "approve" | "reject" | "hide" | "restore"; note?: string }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    const p = z.object({ listingId: uuid, decision: z.enum(["approve", "reject", "hide", "restore"]), note: z.string().trim().max(300).optional() }).safeParse(input);
    if (!p.success) return { ok: false, error: "طلب غير صالح" };
    const { listingId, decision, note } = p.data;
    if (decision === "reject" && !note) return { ok: false, error: "اكتب سبب الرفض ليعرف البائع ما يعدّله" };
    const [l] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!l) return { ok: false, error: "الإعلان غير موجود" };
    const now = new Date();
    const patch =
      decision === "approve" ? { status: "active" as const, publishedAt: l.publishedAt ?? now, bumpedAt: now, moderationNote: null }
      : decision === "reject" ? { status: "rejected" as const, moderationNote: note }
      : decision === "hide" ? { status: "hidden" as const, moderationNote: note ?? "أُخفي من قبل فريق الإشراف" }
      : { status: "active" as const, moderationNote: null };
    await db.update(listings).set(patch).where(eq(listings.id, listingId));
    if (decision === "approve" || decision === "restore") {
      // An explicit moderator approval also closes any SWAP Guard holds on the listing.
      await db
        .update(guardFlags)
        .set({ status: "cleared", reviewerId: staff.id, reviewedAt: now, reviewNote: "اعتُمد الإعلان من قائمة الإشراف" })
        .where(and(eq(guardFlags.subjectType, "listing"), eq(guardFlags.subjectId, listingId), eq(guardFlags.status, "open")));
    }
    await audit(staff.id, `listing.${decision}`, "listing", listingId, { note, from: l.status });
    const msg = {
      approve: { title: "تم نشر إعلانك 🎉", body: `«${l.title}» ظاهر الآن للمشترين.` },
      reject: { title: "لم يُعتمد إعلانك", body: `«${l.title}»: ${note}. عدّله وأعد إرساله.` },
      hide: { title: "أُخفي أحد إعلاناتك", body: `«${l.title}»${note ? `: ${note}` : ""}` },
      restore: { title: "أُعيد نشر إعلانك", body: `«${l.title}» ظاهر من جديد.` },
    }[decision];
    await notify(l.sellerId, { type: "listing_status", ...msg, href: decision === "approve" || decision === "restore" ? `/listing/${l.slug}` : "/account/listings" });
    revalidatePath("/admin/listings");
    revalidatePath("/admin");
    return { ok: true, message: { approve: "نُشر الإعلان", reject: "رُفض الإعلان وأُبلغ البائع", hide: "أُخفي الإعلان", restore: "أُعيد نشر الإعلان" }[decision] };
  });
}

/* ───────── Users ───────── */

export async function moderateUser(input: { userId: string; action: "suspend" | "unsuspend" | "ban" | "trust" | "untrust" | "make_moderator" | "make_user" }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    const p = z.object({ userId: uuid, action: z.enum(["suspend", "unsuspend", "ban", "trust", "untrust", "make_moderator", "make_user"]) }).safeParse(input);
    if (!p.success) return { ok: false, error: "طلب غير صالح" };
    const { userId, action } = p.data;
    if (userId === staff.id) return { ok: false, error: "لا يمكنك تطبيق هذا الإجراء على حسابك" };
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return { ok: false, error: "المستخدم غير موجود" };
    if (target.role === "admin") return { ok: false, error: "لا يمكن تعديل حساب مدير" };
    if ((action === "make_moderator" || action === "make_user" || action === "ban") && staff.role !== "admin") return { ok: false, error: "هذا الإجراء للمدير فقط" };

    const patch = {
      suspend: { status: "suspended" as const },
      unsuspend: { status: "active" as const },
      ban: { status: "banned" as const },
      trust: { trusted: true },
      untrust: { trusted: false },
      make_moderator: { role: "moderator" as const },
      make_user: { role: "user" as const },
    }[action];
    await db.update(users).set(patch).where(eq(users.id, userId));
    if (action === "ban") {
      await destroyAllSessions(userId);
      await db.update(listings).set({ status: "hidden", moderationNote: "حساب البائع محظور" }).where(and(eq(listings.sellerId, userId), eq(listings.status, "active")));
    }
    if (action === "suspend") await notify(userId, { type: "system", title: "تم إيقاف حسابك مؤقتًا", body: "لا يمكنك نشر إعلانات أو إرسال رسائل حتى مراجعة حسابك. تواصل مع الدعم." });
    if (action === "unsuspend") await notify(userId, { type: "system", title: "أُعيد تفعيل حسابك", body: "تقدر تستخدم سواب بشكل طبيعي." });
    await audit(staff.id, `user.${action}`, "user", userId);
    revalidatePath("/admin/users");
    return { ok: true, message: "تم تحديث الحساب" };
  });
}

/* ───────── Reports ───────── */

export async function resolveReport(input: { reportId: string; decision: "resolve" | "dismiss" | "reviewing"; note?: string; hideListing?: boolean; suspendUser?: boolean }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    const p = z.object({ reportId: uuid, decision: z.enum(["resolve", "dismiss", "reviewing"]), note: z.string().trim().max(500).optional(), hideListing: z.boolean().optional(), suspendUser: z.boolean().optional() }).safeParse(input);
    if (!p.success) return { ok: false, error: "طلب غير صالح" };
    const d = p.data;
    const [r] = await db.select().from(abuseReports).where(eq(abuseReports.id, d.reportId)).limit(1);
    if (!r) return { ok: false, error: "البلاغ غير موجود" };
    await db
      .update(abuseReports)
      .set({ status: d.decision === "resolve" ? "resolved" : d.decision === "dismiss" ? "dismissed" : "reviewing", resolutionNote: d.note, resolvedById: d.decision === "reviewing" ? null : staff.id, resolvedAt: d.decision === "reviewing" ? null : new Date() })
      .where(eq(abuseReports.id, r.id));
    if (d.hideListing && r.targetType === "listing") {
      await db.update(listings).set({ status: "hidden", moderationNote: d.note ?? "أُخفي بعد بلاغ" }).where(eq(listings.id, r.targetId));
    }
    if (d.suspendUser) {
      const userId = r.targetType === "user" ? r.targetId : (await db.select({ s: listings.sellerId }).from(listings).where(eq(listings.id, r.targetId)).limit(1))[0]?.s;
      if (userId && userId !== staff.id) await db.update(users).set({ status: "suspended" }).where(and(eq(users.id, userId), ne(users.role, "admin")));
    }
    await audit(staff.id, `report.${d.decision}`, "report", r.id, { note: d.note, hideListing: d.hideListing, suspendUser: d.suspendUser });
    if (r.reporterId && d.decision !== "reviewing") {
      await notify(r.reporterId, { type: "system", title: "شكرًا لبلاغك", body: d.decision === "resolve" ? "راجعنا البلاغ واتخذنا الإجراء المناسب." : "راجعنا البلاغ ولم نجد مخالفة تستدعي إجراءً." });
    }
    revalidatePath("/admin/reports");
    return { ok: true, message: "تم تحديث البلاغ" };
  });
}

/* ───────── Inspections ───────── */

const LEVEL_RANK: Record<VerificationLevel, number> = { unverified: 0, seller_report: 1, platform_checked: 2, partner_verified: 3 };

export async function reviewInspection(input: { inspectionId: string; decision: "approve" | "reject"; level?: VerificationLevel; note?: string }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    const p = z.object({ inspectionId: uuid, decision: z.enum(["approve", "reject"]), level: z.enum(["seller_report", "platform_checked", "partner_verified"]).optional(), note: z.string().trim().max(500).optional() }).safeParse(input);
    if (!p.success) return { ok: false, error: "طلب غير صالح" };
    const d = p.data;
    const [insp] = await db.select().from(inspections).where(eq(inspections.id, d.inspectionId)).limit(1);
    if (!insp) return { ok: false, error: "التقرير غير موجود" };
    if (insp.status !== "submitted") return { ok: false, error: "التقرير ليس بانتظار المراجعة" };
    if (insp.submittedById === staff.id) return { ok: false, error: "لا يمكنك مراجعة تقرير قدّمته بنفسك" };
    const [l] = await db.select({ title: listings.title, slug: listings.slug, sellerId: listings.sellerId }).from(listings).where(eq(listings.id, insp.listingId)).limit(1);

    if (d.decision === "reject") {
      if (!d.note) return { ok: false, error: "اكتب سبب الرفض ليعرف البائع ما ينقص التقرير" };
      await db.update(inspections).set({ status: "rejected", reviewerId: staff.id, reviewedAt: new Date(), reviewNote: d.note }).where(eq(inspections.id, insp.id));
      await notify(l.sellerId, { type: "inspection", title: "لم يُعتمد تقرير الفحص", body: `«${l.title}»: ${d.note}`, href: "/account/verification" });
      await audit(staff.id, "inspection.reject", "inspection", insp.id, { note: d.note });
    } else {
      const level = d.level ?? insp.requestedLevel;
      // Reviewers can grant at most what the evidence source supports.
      if (LEVEL_RANK[level] > LEVEL_RANK[insp.requestedLevel]) return { ok: false, error: `لا يمكن منح مستوى أعلى من المطلوب (${VERIFICATION_META[insp.requestedLevel].short})` };
      if (level === "platform_checked") {
        const [{ hasRaw }] = await db.execute<{ hasRaw: boolean }>(sql`select raw_payload is not null as "hasRaw" from inspection_reports where inspection_id = ${insp.id}`);
        if (!hasRaw) return { ok: false, error: "مستوى «فحص المنصة» يتطلب بيانات من أداة سواب" };
      }
      await db.transaction(async (tx) => {
        await tx.update(inspections).set({ status: "superseded" }).where(and(eq(inspections.listingId, insp.listingId), eq(inspections.status, "approved")));
        await tx.update(inspections).set({ status: "approved", grantedLevel: level, reviewerId: staff.id, reviewedAt: new Date(), reviewNote: d.note ?? null }).where(eq(inspections.id, insp.id));
        await tx.update(listings).set({ verificationLevel: level }).where(eq(listings.id, insp.listingId));
        await tx.insert(verificationStatuses).values({ listingId: insp.listingId, level, inspectionId: insp.id, changedById: staff.id, reason: d.note ?? "اعتماد تقرير الفحص" });
      });
      await notify(l.sellerId, { type: "inspection", title: "تم توثيق إعلانك ✅", body: `«${l.title}» يحمل الآن شارة «${VERIFICATION_META[level].short}».`, href: `/listing/${l.slug}` });
      await audit(staff.id, "inspection.approve", "inspection", insp.id, { level });
    }
    revalidatePath("/admin/inspections");
    revalidatePath(`/listing/${l.slug}`);
    return { ok: true, message: d.decision === "approve" ? "اعتُمد التقرير" : "رُفض التقرير" };
  });
}

export async function revokeVerification(input: { listingId: string; reason: string }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    if (!uuid.safeParse(input.listingId).success || !input.reason?.trim()) return { ok: false, error: "اكتب سبب سحب التوثيق" };
    await db.update(listings).set({ verificationLevel: "unverified" }).where(eq(listings.id, input.listingId));
    await db.update(inspections).set({ status: "superseded" }).where(and(eq(inspections.listingId, input.listingId), eq(inspections.status, "approved")));
    await db.insert(verificationStatuses).values({ listingId: input.listingId, level: "unverified", changedById: staff.id, reason: input.reason });
    await audit(staff.id, "verification.revoke", "listing", input.listingId, { reason: input.reason });
    revalidatePath("/admin/listings");
    return { ok: true, message: "سُحب التوثيق" };
  });
}

/* ───────── Categories & content (admin only) ───────── */

export async function updateCategory(input: { id: number; nameAr?: string; nameEn?: string; descriptionAr?: string; isActive?: boolean; featured?: boolean; move?: "up" | "down" }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff(["admin"]);
    const p = z.object({ id: z.number().int().positive(), nameAr: z.string().trim().min(2).max(40).optional(), nameEn: z.string().trim().min(2).max(40).optional(), descriptionAr: z.string().trim().max(200).optional(), isActive: z.boolean().optional(), featured: z.boolean().optional(), move: z.enum(["up", "down"]).optional() }).safeParse(input);
    if (!p.success) return { ok: false, error: "بيانات غير صالحة" };
    const { id, move, ...patch } = p.data;
    const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!cat) return { ok: false, error: "القسم غير موجود" };
    if (move) {
      const siblings = (await db.select().from(categories)).filter((c) => c.parentId === cat.parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const i = siblings.findIndex((c) => c.id === id);
      const j = move === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < siblings.length) {
        const reordered = [...siblings];
        [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
        for (const [k, c] of reordered.entries()) await db.update(categories).set({ sortOrder: k }).where(eq(categories.id, c.id));
      }
    }
    if (Object.keys(patch).length) await db.update(categories).set(patch).where(eq(categories.id, id));
    await audit(staff.id, "category.update", "category", String(id), { ...patch, move });
    revalidatePath("/", "layout");
    return { ok: true, message: "تم تحديث القسم" };
  });
}

export async function createSubcategory(input: { parentId: number; nameAr: string; nameEn: string; slug: string }): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff(["admin"]);
    const p = z.object({ parentId: z.number().int().positive(), nameAr: z.string().trim().min(2).max(40), nameEn: z.string().trim().min(2).max(40), slug: z.string().trim().regex(/^[a-z0-9-]{2,40}$/, "slug بالإنجليزية الصغيرة والشرطات فقط") }).safeParse(input);
    if (!p.success) return { ok: false, error: p.error.errors[0]?.message ?? "بيانات غير صالحة" };
    const [parent] = await db.select().from(categories).where(eq(categories.id, p.data.parentId)).limit(1);
    if (!parent || parent.parentId) return { ok: false, error: "القسم الأب غير صالح" };
    const [exists] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, p.data.slug)).limit(1);
    if (exists) return { ok: false, error: "الـ slug مستخدم" };
    await db.insert(categories).values({ ...p.data, icon: parent.icon, schemaKey: parent.schemaKey, sortOrder: 99 });
    await audit(staff.id, "category.create", "category", p.data.slug);
    revalidatePath("/admin/categories");
    return { ok: true, message: "أُضيف القسم الفرعي" };
  });
}

const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(4, "العنوان قصير").max(90),
  body: z.string().trim().max(160).optional(),
  href: z.string().trim().max(200).regex(/^\/[^/\\]?.*$/, "رابط داخلي يبدأ بـ /").optional().or(z.literal("")),
  tone: z.enum(["info", "promo", "warning"]),
  isActive: z.boolean(),
});

export async function saveBanner(input: z.input<typeof bannerSchema>): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff(["admin"]);
    const p = bannerSchema.safeParse(input);
    if (!p.success) return { ok: false, error: p.error.errors[0]?.message ?? "بيانات غير صالحة" };
    const { id, ...d } = p.data;
    const values = { ...d, href: d.href || null, body: d.body || null };
    if (id) await db.update(banners).set(values).where(eq(banners.id, id));
    else await db.insert(banners).values({ ...values, placement: "home_top" });
    await audit(staff.id, id ? "banner.update" : "banner.create", "banner", id ?? "new", values);
    revalidatePath("/");
    revalidatePath("/admin/content");
    return { ok: true, message: "حُفظ الإعلان الترويجي" };
  });
}

export async function deleteBanner(id: string): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff(["admin"]);
    if (!uuid.safeParse(id).success) return { ok: false, error: "طلب غير صالح" };
    await db.delete(banners).where(eq(banners.id, id));
    await audit(staff.id, "banner.delete", "banner", id);
    revalidatePath("/");
    revalidatePath("/admin/content");
    return { ok: true, message: "حُذف" };
  });
}

export async function closeTicket(id: string): Promise<Result> {
  return run(async () => {
    const staff = await assertStaff();
    if (!uuid.safeParse(id).success) return { ok: false, error: "طلب غير صالح" };
    await db.update(supportTickets).set({ status: "closed" }).where(eq(supportTickets.id, id));
    await audit(staff.id, "ticket.close", "ticket", id);
    revalidatePath("/admin/reports");
    return { ok: true, message: "أُغلقت الرسالة" };
  });
}
