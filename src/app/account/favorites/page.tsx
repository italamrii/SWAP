import { Heart, TrendingDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PriceAlertToggle } from "@/components/account/price-alert-toggle";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { formatSAR } from "@/lib/format";
import { getFavorites } from "@/server/queries/account";

export const metadata: Metadata = { title: "المفضلة" };

export default async function FavoritesPage() {
  const user = await requireUser("/account/favorites");
  const items = await getFavorites(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="المفضلة" description="الإعلانات اللي حفظتها. نبّهك إذا نزل سعر أي منها." />
      {items.length === 0 ? (
        <EmptyState icon={Heart} title="ما حفظت أي إعلان بعد" description="اضغط على ♡ في أي إعلان لحفظه هنا، وبنبّهك إذا نزل السعر." action={<Button asChild><Link href="/browse">تصفّح الإعلانات</Link></Button>} />
      ) : (
        <ListingGrid className="md:grid-cols-3">
          {items.map(({ listing, priceAtSave, notify }) => (
            <div key={listing.id} className="flex flex-col gap-2">
              <ListingCard listing={listing} saved />
              {listing.price < priceAtSave && (
                <p className="flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-[12px] font-semibold text-primary-ink">
                  <TrendingDown className="size-3.5" />نزل السعر من <bdi>{formatSAR(priceAtSave)}</bdi>
                </p>
              )}
              {listing.status === "active" && <PriceAlertToggle listingId={listing.id} initial={notify} />}
            </div>
          ))}
        </ListingGrid>
      )}
    </div>
  );
}
