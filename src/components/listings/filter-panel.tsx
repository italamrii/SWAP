"use client";

import { ArrowLeftRight, BadgeCheck, ChevronDown, HandCoins, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/checkbox";
import { CITIES } from "@/lib/catalog/cities";
import { CONDITIONS } from "@/lib/catalog/conditions";
import { TRISTATE_LABELS } from "@/lib/catalog/helpers";
import type { SpecField } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { useUrlFilters } from "./use-url-filters";

export interface FilterPanelProps {
  fields: SpecField[];
  facets: Record<string, Record<string, number>>;
  subcategories: { slug: string; nameAr: string }[];
  total: number;
  activeCount: number;
}

export function FilterPanel(props: FilterPanelProps) {
  return (
    <aside aria-label="الفلاتر" className="sticky top-32 hidden max-h-[calc(100dvh-9rem)] w-72 shrink-0 overflow-y-auto pe-2 pb-8 scrollbar-none lg:block">
      <FilterBody {...props} />
    </aside>
  );
}

export function MobileFilterButton(props: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal />
          الفلاتر
          {props.activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{props.activeCount}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" title="الفلاتر" className="h-[88dvh]">
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterBody {...props} />
        </div>
        <div className="flex gap-2 border-t border-border p-4 pb-safe">
          <SheetClose asChild>
            <Button className="flex-1" size="lg">اعرض {props.total} إعلان</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterBody({ fields, facets, subcategories, activeCount }: FilterPanelProps) {
  const { params, update, toggleInList, clearAll, list, pending } = useUrlFilters();
  const conditions = list("condition");

  return (
    <div className={cn("space-y-1 transition-opacity", pending && "opacity-70")}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold">تصفية النتائج</h2>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="text-[13px] font-medium text-primary-ink hover:underline">
            مسح الكل ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-2.5 rounded-xl border border-border bg-surface p-3">
        <ToggleRow icon={BadgeCheck} label="موثّق بتقرير فحص" checked={params.get("verified") === "1"} onChange={(v) => update({ verified: v ? "1" : null })} />
        <ToggleRow icon={ArrowLeftRight} label="يقبل البدل" checked={params.get("swap") === "1"} onChange={(v) => update({ swap: v ? "1" : null })} />
        <ToggleRow icon={HandCoins} label="السعر قابل للتفاوض" checked={params.get("negotiable") === "1"} onChange={(v) => update({ negotiable: v ? "1" : null })} />
      </div>

      {subcategories.length > 0 && (
        <Section title="القسم الفرعي">
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((s) => (
              <Chip key={s.slug} active={params.get("sub") === s.slug} onClick={() => update({ sub: params.get("sub") === s.slug ? null : s.slug })}>
                {s.nameAr}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      <Section title="السعر (ر.س)">
        <PriceRange min={params.get("min") ?? ""} max={params.get("max") ?? ""} onCommit={(min, max) => update({ min, max })} />
      </Section>

      <Section title="المدينة">
        <NativeSelect aria-label="المدينة" value={params.get("city") ?? ""} onChange={(e) => update({ city: e.target.value || null })}>
          <option value="">كل المدن</option>
          {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </NativeSelect>
      </Section>

      <Section title="الحالة">
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => (
            <Chip key={c.value} active={conditions.includes(c.value)} onClick={() => toggleInList("condition", c.value)} title={c.hint}>
              {c.label}
            </Chip>
          ))}
        </div>
      </Section>

      {fields.map((f) => (
        <SpecFilter key={f.key} field={f} counts={facets[f.key] ?? {}} />
      ))}
    </div>
  );
}

function SpecFilter({ field, counts }: { field: SpecField; counts: Record<string, number> }) {
  const { params, update, toggleInList, list } = useUrlFilters();
  const key = `f.${field.key}`;
  const [expanded, setExpanded] = useState(false);

  if (field.type === "number") {
    return (
      <Section title={`${field.label}${field.unit ? ` (${field.unit})` : ""}`} defaultOpen={false} hasValue={!!(params.get(`${key}.min`) || params.get(`${key}.max`))}>
        <PriceRange
          min={params.get(`${key}.min`) ?? ""}
          max={params.get(`${key}.max`) ?? ""}
          onCommit={(min, max) => update({ [`${key}.min`]: min, [`${key}.max`]: max })}
          placeholderMin={field.key.toLowerCase().includes("health") ? "مثلًا 85" : "من"}
        />
      </Section>
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="border-b border-border py-3">
        <ToggleRow label={field.label} count={counts["true"]} checked={params.get(key) === "true"} onChange={(v) => update({ [key]: v ? "true" : null })} />
      </div>
    );
  }

  const options =
    field.type === "tristate"
      ? Object.entries(TRISTATE_LABELS).map(([value, label]) => ({ value, label }))
      : [...(field.options ?? [])];
  // Options with listings first, keeping schema order within each group.
  const sorted = [...options].sort((a, b) => Number((counts[b.value] ?? 0) > 0) - Number((counts[a.value] ?? 0) > 0));
  const visible = expanded ? sorted : sorted.slice(0, 6);
  const selected = list(key);

  return (
    <Section title={field.label} defaultOpen={selected.length > 0 || field.highlight} hasValue={selected.length > 0}>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((o) => {
          const n = counts[o.value] ?? 0;
          return (
            <Chip key={o.value} active={selected.includes(o.value)} disabled={n === 0 && !selected.includes(o.value)} onClick={() => toggleInList(key, o.value)}>
              <bdi>{o.label}{field.unit && field.type === "select" && !/[A-Za-z]{2}$/.test(o.label) ? (field.unit === "″" ? "″" : ` ${field.unit}`) : ""}</bdi>
              <span className="text-[11px] opacity-60 num">{n}</span>
            </Chip>
          );
        })}
      </div>
      {sorted.length > 6 && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-2 text-[13px] font-medium text-primary-ink hover:underline">
          {expanded ? "عرض أقل" : `عرض المزيد (${sorted.length - 6})`}
        </button>
      )}
    </Section>
  );
}

function Section({ title, children, defaultOpen = true, hasValue }: { title: string; children: React.ReactNode; defaultOpen?: boolean; hasValue?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || !!hasValue);
  return (
    <div className="border-b border-border py-3">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-1 text-[13.5px] font-semibold">
        <span className="flex items-center gap-1.5">
          {title}
          {hasValue && <span className="size-1.5 rounded-full bg-primary" aria-label="مفعّل" />}
        </span>
        <ChevronDown className={cn("size-4 text-subtle-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="pt-2.5">{children}</div>}
    </div>
  );
}

function Chip({ active, disabled, onClick, children, title }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium transition",
        active ? "border-primary bg-primary-soft text-primary-ink" : "border-border bg-surface text-foreground hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function ToggleRow({ label, checked, onChange, icon: Icon, count }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon?: typeof BadgeCheck; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[13.5px] font-medium">
      <span className="flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
        {label}
        {count !== undefined && <span className="text-[11px] text-subtle-foreground num">{count}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function PriceRange({ min, max, onCommit, placeholderMin = "من" }: { min: string; max: string; onCommit: (min: string | null, max: string | null) => void; placeholderMin?: string }) {
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  useEffect(() => {
    setLo(min);
    setHi(max);
  }, [min, max]);
  const commit = () => {
    if (lo === min && hi === max) return;
    onCommit(lo || null, hi || null);
  };
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        commit();
      }}
    >
      <Input inputMode="numeric" aria-label="الحد الأدنى" placeholder={placeholderMin} value={lo} onChange={(e) => setLo(e.target.value.replace(/[^\d.]/g, ""))} onBlur={commit} className="h-9 text-center num" dir="ltr" />
      <span className="text-subtle-foreground">–</span>
      <Input inputMode="numeric" aria-label="الحد الأعلى" placeholder="إلى" value={hi} onChange={(e) => setHi(e.target.value.replace(/[^\d.]/g, ""))} onBlur={commit} className="h-9 text-center num" dir="ltr" />
      <button type="submit" className="sr-only">تطبيق</button>
    </form>
  );
}
