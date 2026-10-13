import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-lg border p-4 text-sm leading-relaxed [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0", {
  variants: {
    variant: {
      info: "border-info-ink/15 bg-info-soft text-info-ink",
      success: "border-primary/20 bg-primary-soft text-primary-ink",
      warning: "border-warning/20 bg-warning-soft text-warning",
      danger: "border-danger/20 bg-danger-soft text-danger",
      neutral: "border-border bg-surface-2 text-muted-foreground",
    },
  },
  defaultVariants: { variant: "info" },
});

export function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="note" className={cn(alertVariants({ variant }), className)} {...props} />;
}
