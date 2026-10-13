import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-surface-2 text-muted-foreground",
        outline: "border border-border-strong text-muted-foreground",
        verified: "bg-primary-soft text-primary-ink",
        swap: "bg-swap-soft text-swap-ink",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info-ink",
        dark: "bg-graphite text-background",
        glass: "bg-white/90 text-graphite backdrop-blur shadow-xs dark:bg-black/60 dark:text-white",
      },
      size: { sm: "h-5 px-2 text-[11px]", md: "h-6 px-2.5 text-xs", lg: "h-7 px-3 text-[13px]" },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export function Badge({ className, variant, size, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
