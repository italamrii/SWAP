import "server-only";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { abuseReports, adminAuditLogs, categories, conversations, inspections, listingViews, listings, messages, offers, profiles, users } from "@/lib/db/schema";

export async function getAdminOverview() {
  const [counts] = await db.execute<{
    users: number; newUsers: number; active: number; pending: number; openReports: number; pendingInspections: number; messagesToday: number; offersWeek: number; verified: number; swap: number;
  }>(sql`select
    (select count(*) from ${users})::int as "users",
    (select count(*) from ${users} where created_at > now() - interval '7 days')::int as "newUsers",
    (select count(*) from ${listings} where status = 'active')::int as "active",
    (select count(*) from ${listings} where status = 'pending_review')::int as "pending",
    (select count(*) from ${abuseReports} where status in ('open','reviewing'))::int as "openReports",
    (select count(*) from ${inspections} where status = 'submitted')::int as "pendingInspections",
    (select count(*) from ${messages} where created_at > now() - interval '1 day')::int as "messagesToday",
    (select count(*) from ${offers} where created_at > now() - interval '7 days')::int as "offersWeek",
    (select count(*) from ${listings} where status = 'active' and verification_level <> 'unverified')::int as "verified",
    (select count(*) from ${listings} where status = 'active' and accepts_swap)::int as "swap"`);
  const actor = alias(profiles, "actor");
  const audit = await db
    .select({ id: adminAuditLogs.id, action: adminAuditLogs.action, targetType: adminAuditLogs.targetType, targetId: adminAuditLogs.targetId, meta: adminAuditLogs.meta, createdAt: adminAuditLogs.createdAt, actorName: actor.displayName })
    .from(adminAuditLogs)
    .leftJoin(actor, eq(actor.userId, adminAuditLogs.actorId))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(12);
  return { counts: counts!, audit };
}

export async function getAdminListings(status: string, q?: string) {
  const where: SQL[] = [];
  if (status !== "all") where.push(eq(listings.status, status as "active"));
  if (q) where.push(or(ilike(listings.title, `%${q}%`), ilike(profiles.username, `%${q}%`))!);
  return db
    .select({
      id: listings.id, slug: listings.slug, title: listings.title, price: listings.price, status: listings.status, coverImageUrl: listings.coverImageUrl,
      verificationLevel: listings.verificationLevel, createdAt: listings.createdAt, moderationNote: listings.moderationNote, city: listings.city,
      sellerName: profiles.displayName, sellerUsername: profiles.username, sellerTrusted: users.trusted, category: categories.nameAr,
      reports: sql<number>`(select count(*) from ${abuseReports} r where r.target_id = ${listings.id} and r.status in ('open','reviewing'))::int`,
    })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.sellerId))
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(status === "pending_review" ? listings.createdAt : desc(listings.createdAt))
    .limit(100);
}

export async function getAdminUsers(q?: string, filter?: string) {
  const where: SQL[] = [];
  if (q) where.push(or(ilike(users.email, `%${q}%`), ilike(profiles.username, `%${q}%`), ilike(profiles.displayName, `%${q}%`))!);
  if (filter === "suspended") where.push(inArray(users.status, ["suspended", "banned"]));
  if (filter === "staff") where.push(inArray(users.role, ["admin", "moderator"]));
  return db
    .select({
      id: users.id, email: users.email, role: users.role, status: users.status, trusted: users.trusted, createdAt: users.createdAt, lastSeenAt: users.lastSeenAt,
      username: profiles.username, displayName: profiles.displayName, city: profiles.city,
      listings: sql<number>`(select count(*) from ${listings} l where l.seller_id = ${users.id})::int`,
      reports: sql<number>`(select count(*) from ${abuseReports} r where r.target_id = ${users.id})::int`,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function getAdminReports(status: string) {
  const reporter = alias(profiles, "reporter");
  const rows = await db
    .select({ report: abuseReports, reporterName: reporter.displayName })
    .from(abuseReports)
    .leftJoin(reporter, eq(reporter.userId, abuseReports.reporterId))
    .where(status === "open" ? inArray(abuseReports.status, ["open", "reviewing"]) : inArray(abuseReports.status, ["resolved", "dismissed"]))
    .orderBy(desc(abuseReports.createdAt))
    .limit(100);
  const listingIds = rows.filter((r) => r.report.targetType === "listing").map((r) => r.report.targetId);
  const userIds = rows.filter((r) => r.report.targetType === "user").map((r) => r.report.targetId);
  const ls = listingIds.length ? await db.select({ id: listings.id, title: listings.title, slug: listings.slug, status: listings.status }).from(listings).where(inArray(listings.id, listingIds)) : [];
  const us = userIds.length ? await db.select({ id: profiles.userId, name: profiles.displayName, username: profiles.username }).from(profiles).where(inArray(profiles.userId, userIds)) : [];
  return rows.map((r) => ({
    ...r,
    listing: ls.find((l) => l.id === r.report.targetId) ?? null,
    user: us.find((u) => u.id === r.report.targetId) ?? null,
  }));
}

export async function getInspectionQueue(status: "submitted" | "reviewed") {
  return db
    .select({
      id: inspections.id, status: inspections.status, source: inspections.source, requestedLevel: inspections.requestedLevel, grantedLevel: inspections.grantedLevel,
      submittedAt: inspections.submittedAt, reviewedAt: inspections.reviewedAt, listingTitle: listings.title, listingCover: listings.coverImageUrl,
      sellerName: profiles.displayName, category: categories.nameAr,
    })
    .from(inspections)
    .innerJoin(listings, eq(listings.id, inspections.listingId))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .innerJoin(profiles, eq(profiles.userId, inspections.submittedById))
    .where(status === "submitted" ? eq(inspections.status, "submitted") : inArray(inspections.status, ["approved", "rejected", "superseded"]))
    .orderBy(status === "submitted" ? inspections.submittedAt : desc(inspections.reviewedAt))
    .limit(100);
}

export async function getAnalytics() {
  const byCategory = await db
    .select({ name: categories.nameAr, count: sql<number>`count(${listings.id}) filter (where ${listings.status} = 'active')::int` })
    .from(categories)
    .leftJoin(listings, eq(listings.categoryId, categories.id))
    .where(sql`${categories.parentId} is null`)
    .groupBy(categories.id, categories.nameAr, categories.sortOrder)
    .orderBy(categories.sortOrder);
  const views = await db
    .select({ day: listingViews.day, views: sql<number>`sum(${listingViews.views})::int` })
    .from(listingViews)
    .where(sql`${listingViews.day} >= to_char(now() - interval '29 days', 'YYYY-MM-DD')`)
    .groupBy(listingViews.day)
    .orderBy(listingViews.day);
  const levels = await db
    .select({ level: listings.verificationLevel, count: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.status, "active"))
    .groupBy(listings.verificationLevel);
  const signups = await db.execute<{ day: string; n: number }>(sql`select to_char(created_at, 'YYYY-MM-DD') as day, count(*)::int as n from ${users} where created_at > now() - interval '29 days' group by 1 order by 1`);
  const [funnel] = await db.execute<{ conversations: number; offers: number; accepted: number; sold: number }>(sql`select
    (select count(*) from ${conversations})::int as conversations,
    (select count(*) from ${offers})::int as offers,
    (select count(*) from ${offers} where status = 'accepted')::int as accepted,
    (select count(*) from ${listings} where status = 'sold')::int as sold`);
  const cities = await db.select({ city: listings.city, count: sql<number>`count(*)::int` }).from(listings).where(eq(listings.status, "active")).groupBy(listings.city).orderBy(desc(sql`count(*)`)).limit(8);
  return { byCategory, views, levels, signups: [...signups], funnel: funnel!, cities };
}
