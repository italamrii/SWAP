import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, inspectionAttachments, inspectionReports, inspections, listings, profiles } from "@/lib/db/schema";

export async function latestInspectionsFor(listingIds: string[]) {
  if (!listingIds.length) return [];
  return db
    .select({ id: inspections.id, listingId: inspections.listingId, status: inspections.status, reviewNote: inspections.reviewNote, grantedLevel: inspections.grantedLevel, createdAt: inspections.createdAt })
    .from(inspections)
    .where(inArray(inspections.listingId, listingIds))
    .orderBy(desc(inspections.createdAt));
}

/** Full inspection with report, attachments, listing + category context. Caller must authorize. */
export async function getInspectionDetail(inspectionId: string) {
  const [row] = await db
    .select({
      inspection: inspections,
      listingTitle: listings.title,
      listingSlug: listings.slug,
      listingId: listings.id,
      listingSpecs: listings.specs,
      listingCover: listings.coverImageUrl,
      listingLevel: listings.verificationLevel,
      schemaKey: categories.schemaKey,
      categoryNameAr: categories.nameAr,
      sellerName: profiles.displayName,
      sellerUsername: profiles.username,
    })
    .from(inspections)
    .innerJoin(listings, eq(listings.id, inspections.listingId))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .innerJoin(profiles, eq(profiles.userId, inspections.submittedById))
    .where(eq(inspections.id, inspectionId))
    .limit(1);
  if (!row) return null;
  const [report] = await db.select().from(inspectionReports).where(eq(inspectionReports.inspectionId, inspectionId)).limit(1);
  const attachments = await db.select().from(inspectionAttachments).where(eq(inspectionAttachments.inspectionId, inspectionId)).orderBy(asc(inspectionAttachments.createdAt));
  return { ...row, report: report ?? null, attachments };
}
