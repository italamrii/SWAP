import { ArrowLeftRight, Clock, MapPin } from "lucide-react";
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

export type CardVariant = "grid" | "list";

/**
 * The one listing card used everywhere (home, browse, category, seller, favorites, related).
 * Price-first for fast scanning; specs, condition, city and age always in the same places.
 */
export function ListingCard({
  listing,
  saved = false,
  priority,
  showFavorite = true,
  variant = "grid",
  className,
}: {
  listing: ListingCardData;
  saved?: boolean;
  priority?: boolean;
  showFavorite?: boolean;
  variant?: CardVariant;
  className?: string;
}) {
  const summary = specSummary(listing.schemaKey, listing.specs);
  const sold = listing.status === "sold";
  const href = `/listing/${listing.slug}`;
  const time = (
    <time dateTime={(listing.publishedAt ?? listing.bumpedAt).toISOString()} className="inline-flex shrink-0 items-center gap-1">
      <Clock className="size-3" aria-hidden />
      {timeAgo(listing.bumpedAt)}
    </time>
  );

  if (variant === "list") {
    return (
      <article className={cn("group relative flex gap-3 rounded-xl border border-border bg-surface p-2.5 transition hover:border-border-strong hover:shadow-card sm:gap-4 sm:p-3", className)} data-testid="listing-card">
        <Link href={href} className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-44" tabIndex={-1} aria-hidden>
          <ListingImage src={listing.coverImageUrl} alt="" icon={listing.categoryIcon} sizes="176px" priority={priority} className={cn(sold && "grayscale")} />
          {sold && <span className="absolute inset-x-0 bottom-0 bg-graphite/85 py-0.5 text-center text-[11px] font-bold text-background">تم البيع</span>}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-[14px] leading-snug font-semibold sm:text-[15px]">
              <Link href={href} className="line-clamp-2 outline-offset-2 after:absolute after:inset-0 group-hover:text-primary-ink"><BidiText text={listing.title} /></Link>
            </h3>
            <div className="hidden shrink-0 text-end sm:block">
              <Price halalas={listing.price} />
              {listing.isNegotiable && <p className="text-[11px] text-subtle-foreground">قابل للتفاوض</p>}
            </div>
          </div>
          {summary.length > 0 && <SpecLine parts={summary} className="mt-1" />}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <VerificationBadge level={listing.verificationLevel} size="sm" />
            {listing.acceptsSwap && !sold && <SwapChip />}
            <ConditionChip value={listing.condition} />
          </div>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <span className="sm:hidden"><Price halalas={listing.price} size="sm" /></span>
            <p className="flex min-w-0 items-center gap-2.5 text-[12px] text-subtle-foreground">
              <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="size-3 shrink-0" aria-hidden /><span className="truncate">{cityLabel(listing.city)}</span></span>
              {time}
            </p>
          </div>
        </div>
        {showFavorite && !sold && (
          <div className="absolute top-2 start-2 z-10 sm:top-3 sm:start-3"><FavoriteButton listingId={listing.id} initialSaved={saved} className="size-8" /></div>
        )}
      </article>
    );
  }

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-border-strong hover:shadow-card", className)} data-testid="listing-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <ListingImage
          src={listing.coverImageUrl}
          alt=""
          icon={listing.categoryIcon}
          priority={priority}
          sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn("transition-transform duration-500 ease-out group-hover:scale-[1.03]", sold && "grayscale")}
        />
        <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-start">
          <VerificationBadge level={listing.verificationLevel} variant="glass" size="sm" />
        </div>
        {listing.acceptsSwap && !sold && (
          <span className="pointer-events-none absolute bottom-2 start-2 inline-flex h-5 items-center gap-1 rounded-full bg-swap px-1.5 text-[10.5px] font-semibold text-white shadow-xs">
            <ArrowLeftRight className="size-3" aria-hidden />بدل
          </span>
        )}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full bg-graphite px-3 py-1 text-xs font-bold text-background">تم البيع</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Price halalas={listing.price} />
          {listing.isNegotiable && <span className="text-[11px] text-subtle-foreground">قابل للتفاوض</span>}
        </div>
        <h3 className="mt-1 text-[13.5px] leading-snug font-medium text-foreground">
          {/* Stretched link: whole card is clickable, but only one link in the a11y tree. */}
          <Link href={href} className="line-clamp-2 outline-offset-2 after:absolute after:inset-0 group-hover:text-primary-ink"><BidiText text={listing.title} /></Link>
        </h3>
        {summary.length > 0 && <SpecLine parts={summary} className="mt-1" />}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11.5px] text-subtle-foreground">
          <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="size-3 shrink-0" aria-hidden /><span className="truncate">{cityLabel(listing.city)} · {conditionLabel(listing.condition)}</span></span>
          {time}
        </div>
      </div>
      {showFavorite && !sold && (
        <div className="absolute top-2 end-2 z-10"><FavoriteButton listingId={listing.id} initialSaved={saved} className="size-8" /></div>
      )}
    </article>
  );
}

function SpecLine({ parts, className }: { parts: string[]; className?: string }) {
  return (
    <p className={cn("truncate text-[11.5px] font-medium text-muted-foreground", className)}>
      {parts.map((s, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1 text-border-strong" aria-hidden>•</span>}
          <bdi>{s}</bdi>
        </span>
      ))}
    </p>
  );
}

function SwapChip() {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-swap-soft px-1.5 text-[10.5px] font-semibold text-swap-ink">
      <ArrowLeftRight className="size-3" aria-hidden />يقبل البدل
    </span>
  );
}

function ConditionChip({ value }: { value: string }) {
  return <span className="inline-flex h-5 items-center rounded-full bg-surface-2 px-1.5 text-[10.5px] font-medium text-muted-foreground">{conditionLabel(value)}</span>;
}

export function ListingCardSkeleton({ variant = "grid" }: { variant?: CardVariant }) {
  if (variant === "list") {
    return (
      <div className="flex gap-3 rounded-xl border border-border bg-surface p-3" aria-hidden>
        <div className="aspect-[4/3] w-28 animate-pulse rounded-lg bg-surface-2 sm:w-44" />
        <div className="flex-1 space-y-2 py-1"><div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" /><div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" /><div className="h-5 w-24 animate-pulse rounded bg-surface-2" /></div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-surface-2" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}

/** Responsive grid: 2 → 3 → 4 → 5 → 6 columns (640/768/1024/1280). Pass className to cap columns next to a sidebar. */
export function ListingGrid({ children, className, variant = "grid" }: { children: React.ReactNode; className?: string; variant?: CardVariant }) {
  if (variant === "list") return <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-2", className)}>{children}</div>;
  return <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", className)}>{children}</div>;
}
