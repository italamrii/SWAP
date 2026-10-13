"use client";

import { Field } from "@/components/ui/field";
import { Input, InputAdorned, NativeSelect } from "@/components/ui/input";
import { TRISTATE_LABELS } from "@/lib/catalog/helpers";
import type { SpecField } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

type Value = string | number | boolean | null | undefined;

export function SpecFieldInput({ field, value, onChange, error }: { field: SpecField; value: Value; onChange: (v: Value) => void; error?: string[] }) {
  const id = `spec-${field.key}`;
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
        <span className="text-sm font-medium">{field.label}</span>
        <Segmented
          options={[{ value: "true", label: "نعم" }, { value: "false", label: "لا" }]}
          value={value === true ? "true" : value === false ? "false" : ""}
          onChange={(v) => onChange(v === "true")}
          label={field.label}
        />
      </div>
    );
  }
  if (field.type === "tristate") {
    return (
      <Field label={field.label} required={field.required} error={error} hint={field.hint}>
        <Segmented options={Object.entries(TRISTATE_LABELS).map(([v, l]) => ({ value: v, label: l }))} value={String(value ?? "")} onChange={onChange} label={field.label} full />
      </Field>
    );
  }
  return (
    <Field label={field.label} htmlFor={id} required={field.required} error={error} hint={field.hint}>
      {field.type === "select" ? (
        <NativeSelect id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
          <option value="">اختر…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}{field.unit && !/[A-Za-z]{2}$/.test(o.label) ? (field.unit === "″" ? "″" : ` ${field.unit}`) : ""}</option>
          ))}
        </NativeSelect>
      ) : field.type === "number" ? (
        <InputAdorned id={id} inputMode="decimal" dir="ltr" className="text-start num" value={value === undefined || value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} end={field.unit} aria-invalid={!!error} placeholder={field.placeholder} />
      ) : (
        <Input id={id} dir={field.ltr ? "ltr" : undefined} className={field.ltr ? "text-start" : undefined} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} aria-invalid={!!error} maxLength={120} />
      )}
    </Field>
  );
}

export function Segmented({ options, value, onChange, label, full }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string; full?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-lg bg-surface-2 p-1", full && "flex w-full")}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("h-8 rounded-md px-3 text-[13px] font-medium transition", full && "flex-1", value === o.value ? "bg-surface text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
