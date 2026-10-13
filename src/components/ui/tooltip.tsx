"use client";

import { Tooltip as T } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;

export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <T.Root delayDuration={200}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className={cn("z-50 max-w-64 rounded-md bg-graphite px-2.5 py-1.5 text-xs leading-relaxed text-background shadow-pop data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0")}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
