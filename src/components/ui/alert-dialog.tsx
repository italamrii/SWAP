"use client";

import { AlertDialog as A } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/** Confirmation dialog for destructive or irreversible actions. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "تراجع",
  destructive,
  onConfirm,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <A.Trigger asChild>{trigger}</A.Trigger>}
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <A.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-pop data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0">
          <A.Title className="text-lg font-semibold">{title}</A.Title>
          {description && <A.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</A.Description>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel className={buttonVariants({ variant: "outline" })}>{cancelLabel}</A.Cancel>
            <A.Action className={cn(buttonVariants({ variant: destructive ? "destructive" : "primary" }))} onClick={() => void onConfirm()}>
              {confirmLabel}
            </A.Action>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
