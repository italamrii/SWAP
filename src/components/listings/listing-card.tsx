import { ArrowLeftRight, MapPin } from "lucide-react";
import Link from "next/link";
import { VerificationBadge } from "@/components/inspection/verification-badge";
import { BidiText } from "@/components/shared/bidi-text";
import { Price } from "@/components/shared/price";
import { cityLabel } from "@/lib/catalog/cities";
import { conditionLabel } from "@/lib/catalog/conditions";
import { specSummary } from "@/lib/catalog/helpers";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ListingCardData } from "@/server/types";
import { FavoriteButton } from "./favorite-button";
import { ListingImage } from "./listing-image";

export function ListingCard({
  listing,
  saved = false,
  priority,
  showFavorite = true,
  className,
}: {
  listing: ListingCardData;
  saved?: boolean;
  priority?: boolean;
  showFavorite?: boolean;
  className?: string;
}) {
  const summary = specSummary(listing.schemaKey, listing.specs);
  const sold = listing.status === "sold";
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link href={`/listing/${listing.slug}`} className="flex flex-1 flex-col rounded-xl outline-offset-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-2">
          <ListingImage
            src={listing.coverImageUrl}
            alt={listing.title}
            icon={listing.categoryIcon}
            priority={priority}
            className={cn("transition-transform duration-500 ease-out group-hover:scale-[1.03]", sold && "grayscale")}
          />
          <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
            <VerificationBadge level={listing.verificationLevel} variant="glass" size="sm" />
          </div>
          {sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="rounded-full bg-graphite px-3 py-1 text-xs font-bold text-background">تم البيع</span>
            </div>
          )}
          {listing.acceptsSwap && !sold && (
            <span className="absolute bottom-2.5 start-2.5 inline-flex h-6 items-center gap-1 rounded-full bg-swap px-2 text-[11px] font-semibold text-white shadow-xs">
              <ArrowLeftRight className="size-3" aria-hidden />
              يقبل البدل
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-0.5 pt-3">
          {summary.length > 0 && (
            <p className="mb-1 truncate text-[12px] font-medium text-muted-foreground">
              {summary.map((s, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1 text-border-strong">•</span>}
                  <bdi>{s}</bdi>
                </span>
              ))}
            </p>
          )}
          <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-foreground group-hover:text-primary-ink"><BidiText text={listing.title} /></h3>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
            <div className="flex items-baseline gap-2">
              <Price halalas={listing.price} />
              {listing.isNegotiable && <span className="text-[11px] text-subtle-foreground">قابل للتفاوض</span>}
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-subtle-foreground">
            <MapPin className="size-3" aria-hidden />
            <span>{cityLabel(listing.city)}</span>
            <span aria-hidden>·</span>
            <span>{conditionLabel(listing.condition)}</span>
            <span aria-hidden>·</span>
            <time dateTime={(listing.publishedAt ?? listing.bumpedAt).toISOString()}>{timeAgo(listing.bumpedAt)}</time>
          </div>
        </div>
      </Link>
      {showFavorite && !sold && (
        <div className="absolute top-2.5 end-2.5">
          <FavoriteButton listingId={listing.id} initialSaved={saved} />
        </div>
      )}
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-4 w-11/12 animate-pulse rounded bg-surface-2" />
      <div className="mt-1.5 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-5 w-24 animate-pulse rounded bg-surface-2" />
    </div>
  );
}

export function ListingGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4", className)}>{children}</div>;
}
