import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/listings/form/listing-form";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { listingImages, listings } from "@/lib/db/schema";
import { getCategoryTree } from "@/server/queries/categories";

export const metadata: Metadata = { title: "تعديل الإعلان" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/listings/${id}/edit`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [l] = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, user.id))).limit(1);
  if (!l) notFound();
  const [images, tree] = await Promise.all([db.select().from(listingImages).where(eq(listingImages.listingId, id)).orderBy(asc(listingImages.position)), getCategoryTree()]);
  const cat = tree.find((c) => c.id === l.categoryId);
  const sub = cat?.children.find((c) => c.id === l.subcategoryId);
  return (
    <div className="space-y-6">
      <PageHeader title="تعديل الإعلان" description={l.title} />
      {l.status === "rejected" && <Alert variant="danger">لم يُعتمد الإعلان{l.moderationNote ? `: ${l.moderationNote}` : ""}. بعد الحفظ سيُعاد إرساله للمراجعة.</Alert>}
      {l.verificationLevel !== "unverified" && <Alert variant="info">إعلانك موثّق بتقرير فحص. تغيير القسم يلغي التوثيق الحالي.</Alert>}
      <ListingForm
        listingId={l.id}
        categories={tree.map((c) => ({ slug: c.slug, nameAr: c.nameAr, icon: c.icon, schemaKey: c.schemaKey, children: c.children.map((s) => ({ slug: s.slug, nameAr: s.nameAr })) }))}
        initial={{
          categorySlug: cat?.slug ?? "", subcategorySlug: sub?.slug ?? "", title: l.title, description: l.description, price: String(Math.round(l.price / 100)),
          isNegotiable: l.isNegotiable, acceptsSwap: l.acceptsSwap, swapDetails: l.swapDetails ?? "", condition: l.condition, city: l.city, district: l.district ?? "",
          tags: l.tags.join("، "), images: images.map((i) => ({ url: i.url, width: i.width ?? undefined, height: i.height ?? undefined })), specs: l.specs,
        }}
      />
    </div>
  );
}
