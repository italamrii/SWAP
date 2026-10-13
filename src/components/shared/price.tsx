import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

/** SAR price with the currency set smaller — numbers stay LTR inside RTL text. */
export function Price({ halalas, className, size = "md" }: { halalas: number; className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: ["text-sm", "text-[10px]"],
    md: ["text-base", "text-[11px]"],
    lg: ["text-xl", "text-xs"],
    xl: ["text-3xl sm:text-4xl", "text-sm"],
  }[size];
  return (
    <span className={cn("inline-flex items-baseline gap-1 font-bold tracking-tight", className)}>
      <span className={cn("num", sizes[0])} dir="ltr">{formatAmount(halalas)}</span>
      <span className={cn("font-semibold text-muted-foreground", sizes[1])}>ر.س</span>
    </span>
  );
}
