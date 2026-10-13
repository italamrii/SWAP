import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  href,
  linkLabel = "عرض الكل",
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <div className="mb-2 text-xs font-semibold tracking-wide text-primary-ink">{eyebrow}</div>}
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-ink hover:underline underline-offset-4">
          {linkLabel}
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
