"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      dir="rtl"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border !border-border !bg-surface !text-foreground !shadow-pop !font-sans",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-primary",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
    />
  );
}
