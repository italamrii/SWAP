"use client";

import { XIcon } from "lucide-react";
import { Dialog as D } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;

type Side = "start" | "end" | "bottom";

const sideClass: Record<Side, string> = {
  start: "inset-y-0 start-0 h-full w-[88%] max-w-sm border-e data-[state=open]:slide-in-from-right rtl:data-[state=open]:slide-in-from-right ltr:data-[state=open]:slide-in-from-left",
  end: "inset-y-0 end-0 h-full w-[88%] max-w-sm border-s rtl:data-[state=open]:slide-in-from-left ltr:data-[state=open]:slide-in-from-right",
  bottom: "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t data-[state=open]:slide-in-from-bottom",
};

export function SheetContent({ className, children, side = "end", title, ...props }: React.ComponentProps<typeof D.Content> & { side?: Side; title: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface shadow-pop outline-none data-[state=open]:animate-in data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          sideClass[side],
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <D.Title className="text-base font-semibold">{title}</D.Title>
          <D.Close className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-2" aria-label="إغلاق">
            <XIcon className="size-4" />
          </D.Close>
        </div>
        <D.Description className="sr-only">{title}</D.Description>
        {children}
      </D.Content>
    </D.Portal>
  );
}
