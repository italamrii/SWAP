import { BadgeCheck, FileCheck2, ShieldCheck, ShieldQuestion } from "lucide-react";
import { VERIFICATION_META, type VerificationLevel } from "@/lib/catalog/verification";
import { cn } from "@/lib/utils";

const STYLE: Record<VerificationLevel, { icon: typeof ShieldCheck; className: string; glass: string }> = {
  unverified: { icon: ShieldQuestion, className: "bg-surface-2 text-muted-foreground", glass: "bg-white/85 text-graphite/70 dark:bg-black/55 dark:text-white/70" },
  seller_report: { icon: FileCheck2, className: "bg-info-soft text-info-ink", glass: "bg-white/90 text-info-ink dark:bg-black/60" },
  platform_checked: { icon: ShieldCheck, className: "bg-primary-soft text-primary-ink", glass: "bg-white/90 text-primary-ink dark:bg-black/60" },
  partner_verified: { icon: BadgeCheck, className: "bg-primary text-primary-foreground", glass: "bg-primary text-primary-foreground" },
};

export function VerificationBadge({
  level,
  size = "md",
  variant = "solid",
  showUnverified = false,
  className,
}: {
  level: VerificationLevel;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "glass";
  showUnverified?: boolean;
  className?: string;
}) {
  if (level === "unverified" && !showUnverified) return null;
  const s = STYLE[level];
  const Icon = s.icon;
  return (
    <span
      title={VERIFICATION_META[level].description}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold",
        size === "sm" && "h-5 px-1.5 text-[10.5px] [&_svg]:size-3",
        size === "md" && "h-6 px-2 text-xs [&_svg]:size-3.5",
        size === "lg" && "h-8 px-3 text-sm [&_svg]:size-4",
        variant === "glass" ? cn(s.glass, "shadow-xs backdrop-blur") : s.className,
        className,
      )}
    >
      <Icon aria-hidden />
      {VERIFICATION_META[level].short}
    </span>
  );
}
