import Link from "next/link";
import { cn } from "@/lib/utils";

/** SWAP mark: two opposing arrows (the swap) inside a rounded tile. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <g fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12.2h13" />
        <path d="m18.6 8.8 3.6 3.4-3.6 3.4" />
        <path d="M23 19.8H10" />
        <path d="m13.4 16.4-3.6 3.4 3.6 3.4" />
      </g>
    </svg>
  );
}

export function Logo({ className, href = "/", compact }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="سواب — الصفحة الرئيسية">
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[-8deg]" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[19px] font-bold tracking-tight">سواب</span>
          <span className="mt-0.5 text-[9.5px] font-semibold tracking-[0.28em] text-subtle-foreground" dir="ltr">SWAP</span>
        </span>
      )}
    </Link>
  );
}
