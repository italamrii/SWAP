import { cn } from "@/lib/utils";

export function Stat({ label, value, hint, icon, className }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4 shadow-xs", className)}>
      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight num">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
