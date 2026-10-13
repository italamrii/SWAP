import { getSpecSchema } from "@/lib/catalog/specs";
import { formatSpecValue } from "@/lib/catalog/helpers";
import type { SpecValues } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const GROUPS = { core: "المواصفات", condition: "الحالة والاستخدام", extras: "الملحقات والإضافات" } as const;

export function SpecTable({ schemaKey, specs, extraRows = [] }: { schemaKey: string; specs: SpecValues; extraRows?: { label: string; value: string }[] }) {
  const schema = getSpecSchema(schemaKey);
  if (!schema) return null;
  const groups = (Object.keys(GROUPS) as (keyof typeof GROUPS)[])
    .map((g) => ({
      key: g,
      rows: schema.fields
        .filter((f) => f.group === g)
        .map((f) => ({ field: f, value: formatSpecValue(f, specs[f.key]) }))
        .filter((r) => r.value !== null),
    }))
    .filter((g) => g.rows.length > 0 || (g.key === "condition" && extraRows.length));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.map((g) => (
        <div key={g.key} className={cn(g.key === "core" && "md:col-span-2")}>
          <h3 className="mb-2 text-[13px] font-semibold text-muted-foreground">{GROUPS[g.key]}</h3>
          <dl className={cn("overflow-hidden rounded-xl border border-border bg-surface", g.key === "core" && "md:grid md:grid-cols-2")}>
            {[...(g.key === "condition" ? extraRows.map((r) => ({ label: r.label, value: r.value, ltr: false, warn: false })) : []), ...g.rows.map((r) => ({ label: r.field.label, value: r.value!, ltr: !!r.field.ltr, warn: r.field.type === "tristate" && specs[r.field.key] === "yes" && ["mined", "repaired", "deadPixels", "burnIn"].includes(r.field.key) }))].map(
              (row, i) => (
                <div key={i} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className={cn("text-end font-semibold", row.warn && "text-warning")} dir={row.ltr ? "ltr" : undefined}>{row.value}</dd>
                </div>
              ),
            )}
          </dl>
        </div>
      ))}
    </div>
  );
}
