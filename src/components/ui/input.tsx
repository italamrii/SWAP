import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "flex h-10 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-sm text-foreground shadow-xs transition-[border-color,box-shadow] placeholder:text-subtle-foreground hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-danger/15";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(inputClass, "min-h-28 h-auto py-2.5 leading-relaxed", className)} {...props} />;
}

/** Native select — accessible, fast, great on mobile. Styled to match inputs. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(inputClass, "appearance-none pe-9 cursor-pointer", className)}
        {...props}
      >
        {children}
      </select>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
}

/** Input with a trailing/leading adornment (unit, currency, icon). */
export function InputAdorned({
  className,
  start,
  end,
  ...props
}: React.ComponentProps<"input"> & { start?: React.ReactNode; end?: React.ReactNode }) {
  return (
    <div className="relative">
      {start && <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-subtle-foreground">{start}</span>}
      <input className={cn(inputClass, start && "ps-9", end && "pe-14", className)} {...props} />
      {end && <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-subtle-foreground">{end}</span>}
    </div>
  );
}
