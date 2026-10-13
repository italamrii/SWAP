"use client";

import { RadioGroup as R } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioCardOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export function RadioCards({
  options,
  className,
  itemClassName,
  ...props
}: React.ComponentProps<typeof R.Root> & { options: RadioCardOption[]; itemClassName?: string }) {
  return (
    <R.Root className={cn("grid gap-2", className)} {...props}>
      {options.map((o) => (
        <R.Item
          key={o.value}
          value={o.value}
          className={cn(
            "group flex items-start gap-3 rounded-lg border border-border bg-surface p-3 text-start transition hover:border-border-strong data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft/50 data-[state=checked]:ring-1 data-[state=checked]:ring-primary",
            itemClassName,
          )}
        >
          {o.icon && <span className="mt-0.5 text-muted-foreground group-data-[state=checked]:text-primary-ink">{o.icon}</span>}
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold">{o.label}</span>
            {o.description && <span className="text-xs leading-relaxed text-muted-foreground">{o.description}</span>}
          </span>
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong group-data-[state=checked]:border-primary">
            <R.Indicator className="size-2 rounded-full bg-primary" />
          </span>
        </R.Item>
      ))}
    </R.Root>
  );
}
