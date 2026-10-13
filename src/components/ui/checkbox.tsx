"use client";

import { CheckIcon } from "lucide-react";
import { Checkbox as C, Switch as S } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: React.ComponentProps<typeof C.Root>) {
  return (
    <C.Root
      className={cn(
        "peer size-[18px] shrink-0 rounded-[5px] border border-border-strong bg-surface shadow-xs transition data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <C.Indicator className="flex items-center justify-center">
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </C.Indicator>
    </C.Root>
  );
}

export function Switch({ className, ...props }: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-border-strong p-0.5 transition data-[state=checked]:bg-primary disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <S.Thumb className="block size-5 rounded-full bg-white shadow transition-transform data-[state=checked]:-translate-x-4 ltr:data-[state=checked]:translate-x-4" />
    </S.Root>
  );
}
