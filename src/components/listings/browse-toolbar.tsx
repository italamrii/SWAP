"use client";

import { LayoutGrid, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/ui/input";
import { SORTS } from "@/lib/browse-params";
import { useUrlFilters } from "./use-url-filters";

export function SortSelect() {
  const { params, update } = useUrlFilters();
  return (
    <NativeSelect aria-label="الترتيب" value={params.get("sort") ?? "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })} className="h-10 w-full min-w-0">
      {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </NativeSelect>
  );
}

export interface ActiveChip {
  key: string;
  label: string;
  /** param changes that remove this chip */
  remove: Record<string, string | null>;
}

export function ActiveFilterChips({ chips }: { chips: ActiveChip[] }) {
  const { update, clearAll } = useUrlFilters();
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => update(c.remove)}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-primary/25 bg-primary-soft ps-3 pe-2 text-[13px] font-medium text-primary-ink transition hover:border-primary/50"
          aria-label={`إزالة فلتر ${c.label}`}
        >
          <bdi>{c.label}</bdi>
          <X className="size-3.5" aria-hidden />
        </button>
      ))}
      <button type="button" onClick={clearAll} className="px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground">مسح الكل</button>
    </div>
  );
}

export function ViewToggle() {
  const { params, update } = useUrlFilters();
  const view = params.get("view") === "list" ? "list" : "grid";
  const opt = (v: "grid" | "list", label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => update({ view: v === "grid" ? null : "list" }, { keepPage: true })}
      aria-pressed={view === v}
      aria-label={label}
      className={cn("flex size-8 items-center justify-center rounded-md transition", view === v ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
    >
      <Icon className="size-4" />
    </button>
  );
  return (
    <div className="flex rounded-lg bg-surface-2 p-1" role="group" aria-label="طريقة العرض">
      {opt("grid", "عرض شبكي", LayoutGrid)}
      {opt("list", "عرض قائمة", List)}
    </div>
  );
}
