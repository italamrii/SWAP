import { ListingCardSkeleton, ListingGrid } from "@/components/listings/listing-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page pt-8" aria-busy="true" aria-label="جارٍ التحميل">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-5 h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-48" />
      <div className="mt-8 flex gap-8">
        <div className="hidden w-72 shrink-0 space-y-4 lg:block">
          <Skeleton className="h-28 w-full rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
        <div className="flex-1">
          <ListingGrid className="md:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </ListingGrid>
        </div>
      </div>
    </div>
  );
}
