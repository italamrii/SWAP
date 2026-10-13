"use client";

import { Popover as P } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverAnchor = P.Anchor;

export function PopoverContent({ className, sideOffset = 6, align = "start", ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 rounded-xl border border-border bg-surface p-3 shadow-pop outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0", className)}
        {...props}
      />
    </P.Portal>
  );
}
