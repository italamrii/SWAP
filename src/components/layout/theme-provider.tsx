"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import { Direction } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <Direction.Provider dir="rtl">
        <TooltipProvider>{children}</TooltipProvider>
      </Direction.Provider>
    </NextThemes>
  );
}
