"use client";

import { Check, ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CITIES, cityLabel } from "@/lib/catalog/cities";
import { cn } from "@/lib/utils";
import { useCity } from "./use-city";

export function CityPicker({ className, compact }: { className?: string; compact?: boolean }) {
  const { city, setCity } = useCity();
  const [open, setOpen] = useState(false);
  const choose = (v: string) => {
    setCity(v);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn("inline-flex h-full shrink-0 items-center gap-1.5 text-[13px] font-medium text-foreground outline-offset-2", className)}
        aria-label={`المدينة: ${city ? cityLabel(city) : "كل المدن"} — تغيير المدينة`}
      >
        <MapPin className="size-4 text-primary" aria-hidden />
        <span className={cn("truncate", compact ? "max-w-16" : "max-w-24")}>{city ? cityLabel(city) : "كل المدن"}</span>
        <ChevronDown className="size-3.5 text-subtle-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,22rem)] p-2">
        <p className="px-2 pt-1 pb-2 text-xs font-semibold text-muted-foreground">اختر مدينتك — نطبقها على نتائج البحث</p>
        <div className="grid max-h-80 grid-cols-2 gap-0.5 overflow-y-auto" role="listbox" aria-label="المدن">
          {[{ value: "", label: "كل المدن" }, ...CITIES].map((c) => (
            <button
              key={c.value || "all"}
              type="button"
              role="option"
              aria-selected={city === c.value}
              onClick={() => choose(c.value)}
              className={cn("flex items-center justify-between rounded-md px-2.5 py-2 text-start text-sm hover:bg-surface-2", city === c.value && "bg-primary-soft font-semibold text-primary-ink")}
            >
              {c.label}
              {city === c.value && <Check className="size-3.5" aria-hidden />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
