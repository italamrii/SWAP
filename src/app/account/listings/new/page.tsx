import type { Metadata } from "next";
import { ListingForm } from "@/components/listings/form/listing-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/guards";
import { getCategoryTree } from "@/server/queries/categories";

export const metadata: Metadata = { title: "إعلان جديد" };

export default async function NewListingPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [user, tree, sp] = await Promise.all([requireUser("/account/listings/new"), getCategoryTree(), searchParams]);
  return (
    <div className="space-y-6">
      <PageHeader title="أضف إعلانًا جديدًا" description="خمس خطوات بسيطة. كل ما كانت التفاصيل أوضح، كان البيع أسرع." />
      <ListingForm
        categories={tree.map((c) => ({ slug: c.slug, nameAr: c.nameAr, icon: c.icon, schemaKey: c.schemaKey, children: c.children.map((s) => ({ slug: s.slug, nameAr: s.nameAr })) }))}
        initial={{
          categorySlug: tree.some((c) => c.slug === sp.category) ? sp.category! : "",
          subcategorySlug: "", title: "", description: "", price: "", isNegotiable: true, acceptsSwap: false, swapDetails: "", condition: "",
          city: user.city ?? "", district: "", tags: "", images: [], specs: {},
        }}
      />
    </div>
  );
}
