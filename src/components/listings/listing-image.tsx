import Image from "next/image";
import { CategoryIcon } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";

/** Listing image with a graceful category placeholder. SVG/remote sources skip the optimizer. */
export function ListingImage({
  src,
  alt,
  icon = "accessory",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority,
  className,
  fit = "cover",
}: {
  src: string | null | undefined;
  alt: string;
  icon?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
}) {
  if (!src) {
    return (
      <div className={cn("flex size-full items-center justify-center bg-gradient-to-br from-surface-2 to-border/60", className)} role="img" aria-label={alt}>
        <CategoryIcon icon={icon} className="size-12 text-subtle-foreground/70" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith(".svg") || /^https?:/.test(src)}
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
