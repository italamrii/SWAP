"use client";

import { ArrowLeftRight, Check, HandCoins, Lightbulb, Wand2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Price } from "@/components/shared/price";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, InputAdorned, NativeSelect, Textarea } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { CITIES, cityLabel } from "@/lib/catalog/cities";
import { CONDITIONS, conditionLabel } from "@/lib/catalog/conditions";
import { specSummary } from "@/lib/catalog/helpers";
import { getSpecSchema } from "@/lib/catalog/specs";
import { cn } from "@/lib/utils";
import { createListing, updateListing } from "@/server/actions/listings";
import { ListingImage } from "../listing-image";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { SpecFieldInput } from "./spec-field-input";

export interface FormCategory {
  slug: string;
  nameAr: string;
  icon: string;
  schemaKey: string;
  children: { slug: string; nameAr: string }[];
}

export interface ListingFormValues {
  categorySlug: string;
  subcategorySlug: string;
  title: string;
  description: string;
  price: string;
  isNegotiable: boolean;
  acceptsSwap: boolean;
  swapDetails: string;
  condition: string;
  city: string;
  district: string;
  tags: string;
  images: UploadedImage[];
  specs: Record<string, string | number | boolean | null | undefined>;
}

const SECTIONS = [
  { id: "category", label: "القسم" },
  { id: "photos", label: "الصور" },
  { id: "specs", label: "المواصفات" },
  { id: "details", label: "العنوان والحالة" },
  { id: "pricing", label: "السعر والبدل" },
] as const;

const SECTION_OF: Record<string, (typeof SECTIONS)[number]["id"]> = {
  categorySlug: "category", subcategorySlug: "category", images: "photos", title: "details", description: "details", condition: "details", tags: "details",
  price: "pricing", city: "pricing", swapDetails: "pricing", district: "pricing",
};

export function ListingForm({ categories, initial, listingId }: { categories: FormCategory[]; initial: ListingFormValues; listingId?: string }) {
  const [v, setV] = useState<ListingFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const category = categories.find((c) => c.slug === v.categorySlug);
  const schema = category ? getSpecSchema(category.schemaKey) : undefined;

  const set = <K extends keyof ListingFormValues>(k: K, val: ListingFormValues[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: undefined }));
  };
  const setSpec = (key: string, val: unknown) => {
    setV((p) => ({ ...p, specs: { ...p.specs, [key]: val as string } }));
    if (errors[`specs.${key}`]) setErrors((e) => ({ ...e, [`specs.${key}`]: undefined }));
  };

  const completion = useMemo(() => {
    const done = {
      category: !!v.categorySlug,
      photos: v.images.length > 0,
      specs: !!schema && schema.fields.filter((f) => f.required).every((f) => v.specs[f.key] !== undefined && v.specs[f.key] !== ""),
      details: v.title.trim().length >= 8 && v.description.trim().length >= 30 && !!v.condition,
      pricing: Number(v.price) > 0 && !!v.city,
    };
    return done;
  }, [v, schema]);

  function suggestTitle() {
    if (!category) return;
    const parts = specSummary(category.schemaKey, v.specs as Record<string, string>, 3);
    if (!parts.length) return toast("عبّئ المواصفات الأساسية أولًا، ونقترح لك عنوانًا منها.");
    const cond = v.condition ? ` — ${conditionLabel(v.condition)}` : "";
    set("title", `${parts.join(" · ")}${cond}`.slice(0, 90));
  }

  function submit() {
    const payload = {
      categorySlug: v.categorySlug,
      subcategorySlug: v.subcategorySlug || undefined,
      title: v.title,
      description: v.description,
      price: v.price as unknown as number,
      isNegotiable: v.isNegotiable,
      acceptsSwap: v.acceptsSwap,
      swapDetails: v.acceptsSwap ? v.swapDetails || undefined : undefined,
      condition: v.condition as never,
      city: v.city as never,
      district: v.district || undefined,
      tags: v.tags.split(/[,،]/).map((t) => t.trim()).filter(Boolean),
      images: v.images,
      specs: Object.fromEntries(Object.entries(v.specs).filter(([, val]) => val !== undefined && val !== "")) as Record<string, string>,
    };
    start(async () => {
      const res = listingId ? await updateListing(listingId, payload) : await createListing(payload);
      // Success redirects server-side; we only get here on failure.
      if (res && !res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        const firstKey = Object.keys(res.fieldErrors ?? {})[0];
        const section = firstKey ? (firstKey.startsWith("specs.") ? "specs" : SECTION_OF[firstKey]) : undefined;
        if (section) document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const preview = { title: v.title || "عنوان إعلانك", price: Number(v.price || 0) * 100 };
  const summary = category ? specSummary(category.schemaKey, v.specs as Record<string, string>) : [];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {/* 1. Category */}
        <Section id="category" n={1} title="وش تبي تبيع؟" description="اختر القسم عشان نجهّز لك المواصفات المناسبة." done={completion.category}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" role="radiogroup" aria-label="القسم">
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="radio"
                aria-checked={v.categorySlug === c.slug}
                onClick={() => {
                  if (c.slug !== v.categorySlug) setV((p) => ({ ...p, categorySlug: c.slug, subcategorySlug: "", specs: {} }));
                  setErrors((e) => ({ ...e, categorySlug: undefined }));
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-start text-sm font-medium transition",
                  v.categorySlug === c.slug ? "border-primary bg-primary-soft/60 ring-1 ring-primary" : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <CategoryIcon icon={c.icon} className={cn("size-5 shrink-0", v.categorySlug === c.slug ? "text-primary-ink" : "text-muted-foreground")} />
                {c.nameAr}
              </button>
            ))}
          </div>
          {errors.categorySlug && <p role="alert" className="mt-2 text-[13px] text-danger">{errors.categorySlug[0]}</p>}
          {category && category.children.length > 0 && (
            <Field label="القسم الفرعي" optional className="mt-4 max-w-sm" error={errors.subcategorySlug}>
              <NativeSelect value={v.subcategorySlug} onChange={(e) => set("subcategorySlug", e.target.value)}>
                <option value="">— اختر —</option>
                {category.children.map((s) => <option key={s.slug} value={s.slug}>{s.nameAr}</option>)}
              </NativeSelect>
            </Field>
          )}
        </Section>

        {/* 2. Photos */}
        <Section id="photos" n={2} title="الصور" description="صور واضحة من عدة زوايا، وصورة للملصق أو الرقم التسلسلي إن أمكن." done={completion.photos}>
          <ImageUploader value={v.images} onChange={(imgs) => set("images", imgs)} error={errors.images} />
        </Section>

        {/* 3. Specs */}
        <Section id="specs" n={3} title="المواصفات" description={schema ? "المواصفات المنظّمة تظهر في الفلاتر وتساعد المشتري يقارن بسرعة." : "اختر القسم أولًا."} done={completion.specs}>
          {schema ? (
            <div className="space-y-6">
              {(["core", "condition", "extras"] as const).map((g) => {
                const fields = schema.fields.filter((f) => f.group === g);
                if (!fields.length) return null;
                return (
                  <div key={g}>
                    <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">{g === "core" ? "الأساسية" : g === "condition" ? "الحالة والاستخدام" : "الملحقات"}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {fields.map((f) => (
                        <SpecFieldInput key={f.key} field={f} value={v.specs[f.key]} onChange={(val) => setSpec(f.key, val)} error={errors[`specs.${f.key}`]} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-surface-2 p-4 text-sm text-muted-foreground">اختر القسم من الخطوة الأولى لتظهر المواصفات الخاصة به.</p>
          )}
        </Section>

        {/* 4. Details */}
        <Section id="details" n={4} title="العنوان والحالة والوصف" done={completion.details}>
          <div className="space-y-5">
            <Field label="عنوان الإعلان" htmlFor="title" required error={errors.title} hint={`${v.title.length}/90 — اذكر الموديل وأهم ميزة، مثل: «RTX 4070 Super — 12GB بضمان وكيل»`}>
              <div className="flex gap-2">
                <Input id="title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={90} aria-invalid={!!errors.title} />
                <Button type="button" variant="outline" onClick={suggestTitle} className="shrink-0"><Wand2 />اقترح</Button>
              </div>
            </Field>
            <Field label="الحالة" required error={errors.condition}>
              <RadioCards value={v.condition} onValueChange={(val) => set("condition", val)} className="sm:grid-cols-3" itemClassName="p-3" options={CONDITIONS.map((c) => ({ value: c.value, label: c.label, description: c.hint }))} />
            </Field>
            <Field label="الوصف" htmlFor="description" required error={errors.description} hint={`${v.description.trim().length} حرف — كن صريحًا: مدة الاستخدام، سبب البيع، أي ملاحظات أو عيوب.`}>
              <Textarea id="description" rows={7} value={v.description} onChange={(e) => set("description", e.target.value)} maxLength={4000} aria-invalid={!!errors.description} placeholder={"مثال:\nمشترى من جرير قبل 8 أشهر والفاتورة موجودة. استخدام ألعاب فقط، ما تعرّض لأوفركلوك. سبب البيع: ترقية."} />
            </Field>
            <Field label="وسوم" htmlFor="tags" optional hint="افصل بينها بفاصلة. تساعد في البحث (مثلًا: RTX، ضمان، قيمنق)." error={errors.tags}>
              <Input id="tags" value={v.tags} onChange={(e) => set("tags", e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* 5. Pricing */}
        <Section id="pricing" n={5} title="السعر والبدل والموقع" done={completion.pricing}>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="السعر" htmlFor="price" required error={errors.price}>
                <InputAdorned id="price" inputMode="numeric" dir="ltr" className="h-12 text-start text-lg font-bold num" value={v.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} end="ر.س" aria-invalid={!!errors.price} />
              </Field>
              <Field label="المدينة" htmlFor="city" required error={errors.city}>
                <NativeSelect id="city" value={v.city} onChange={(e) => set("city", e.target.value)} className="h-12" aria-invalid={!!errors.city}>
                  <option value="">اختر المدينة</option>
                  {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </NativeSelect>
              </Field>
            </div>
            <Field label="الحي" htmlFor="district" optional hint="لا تكتب عنوانك التفصيلي — الحي يكفي.">
              <Input id="district" value={v.district} onChange={(e) => set("district", e.target.value)} maxLength={60} />
            </Field>
            <ToggleCard icon={HandCoins} title="السعر قابل للتفاوض" description="يسمح للمشترين بتقديم عروض سعر." checked={v.isNegotiable} onChange={(c) => set("isNegotiable", c)} />
            <ToggleCard icon={ArrowLeftRight} title="أقبل البدل" description="يظهر إعلانك في قسم البدل، ويقدر المشترون يقترحون قطعًا مع فرق سعر." checked={v.acceptsSwap} onChange={(c) => set("acceptsSwap", c)} tone="swap" />
            {v.acceptsSwap && (
              <Field label="وش تدوّر عليه في البدل؟" optional error={errors.swapDetails}>
                <Textarea rows={2} value={v.swapDetails} onChange={(e) => set("swapDetails", e.target.value)} maxLength={300} placeholder="مثلًا: أبدّل بـ RX 7900 GRE مع فرق، أو شاشة 1440p 240Hz" />
              </Field>
            )}
          </div>
        </Section>

        {Object.keys(errors).some((k) => errors[k]) && <Alert variant="danger">في حقول تحتاج تصحيح — راجع الأقسام المظللة بالأحمر.</Alert>}

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-surface sm:px-5 pb-safe">
          <p className="hidden text-[13px] text-muted-foreground sm:block">
            {listingId ? "التعديلات تظهر فورًا على الإعلان." : "بالنشر، تقر بأن المعلومات صحيحة وأن القطعة ملكك."}
          </p>
          <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
            {listingId ? "حفظ التعديلات" : "نشر الإعلان"}
          </Button>
        </div>
      </form>

      {/* Sidebar: progress + live preview */}
      <aside className="hidden xl:block">
        <div className="sticky top-24 space-y-4">
          <nav aria-label="خطوات الإعلان" className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <ol className="space-y-1">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                    <span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-bold", completion[s.id] ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground")}>
                      {completion[s.id] ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="rounded-2xl border border-border bg-surface p-3 shadow-xs">
            <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">معاينة الإعلان</p>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2">
              <ListingImage src={v.images[0]?.url} alt="" icon={category?.icon} sizes="300px" />
            </div>
            <div className="px-1 pt-3 pb-1">
              {summary.length > 0 && <p className="mb-1 truncate text-xs text-muted-foreground">{summary.join(" • ")}</p>}
              <p className="line-clamp-2 text-sm font-semibold">{preview.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <Price halalas={preview.price} size="sm" />
                <span className="text-xs text-subtle-foreground">{v.city ? cityLabel(v.city) : "المدينة"}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2.5 rounded-2xl border border-border bg-surface p-4 text-[13px] leading-relaxed text-muted-foreground">
            <Lightbulb className="size-4 shrink-0 text-amber-500" />
            بعد النشر، أضف تقرير فحص من «التوثيق والفحص» لترفع ثقة المشترين.
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({ id, n, title, description, done, children }: { id: string; n: number; title: string; description?: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6" aria-labelledby={`${id}-h`}>
      <div className="mb-5 flex items-start gap-3">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold", done ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground")}>
          {done ? <Check className="size-4" strokeWidth={3} /> : n}
        </span>
        <div>
          <h2 id={`${id}-h`} className="font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleCard({ icon: Icon, title, description, checked, onChange, tone }: { icon: typeof HandCoins; title: string; description: string; checked: boolean; onChange: (v: boolean) => void; tone?: "swap" }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition", checked ? (tone === "swap" ? "border-swap/40 bg-swap-soft/60" : "border-primary/30 bg-primary-soft/40") : "border-border")}>
      <Icon className={cn("size-5 shrink-0", checked ? (tone === "swap" ? "text-swap" : "text-primary") : "text-muted-foreground")} />
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-[13px] text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className={tone === "swap" ? "data-[state=checked]:bg-swap" : undefined} />
    </label>
  );
}
