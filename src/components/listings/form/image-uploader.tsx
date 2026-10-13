"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ListingImage } from "@/components/listings/listing-image";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; width?: number; height?: number };

export async function uploadFile(file: File, kind: "listing" | "inspection" | "avatar") {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("kind", kind);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({ error: "تعذّر الرفع" }));
  if (!res.ok) throw new Error(data.error ?? "تعذّر الرفع");
  return data as UploadedImage & { kind: "image" | "pdf" };
}

export function ImageUploader({ value, onChange, max = 10, error }: { value: UploadedImage[]; onChange: (v: UploadedImage[]) => void; max?: number; error?: string[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, max - value.length);
    if (!list.length) return toast.error(`الحد الأقصى ${max} صور`);
    setUploading((n) => n + list.length);
    const results: UploadedImage[] = [];
    await Promise.all(
      list.map(async (f) => {
        try {
          results.push(await uploadFile(f, "listing"));
        } catch (e) {
          toast.error(`${f.name}: ${(e as Error).message}`);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (results.length) onChange([...value, ...results]);
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((img, i) => (
          <div key={img.url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-2">
            <ListingImage src={img.url} alt={`صورة ${i + 1}`} sizes="200px" />
            {i === 0 && <span className="absolute top-1.5 start-1.5 inline-flex items-center gap-1 rounded-full bg-graphite/85 px-2 py-0.5 text-[10.5px] font-semibold text-background"><Star className="size-3" />الغلاف</span>}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute top-1.5 end-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80" aria-label={`حذف الصورة ${i + 1}`}>
              <X className="size-4" />
            </button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="flex size-7 items-center justify-center rounded-full bg-white/90 text-graphite disabled:opacity-0" aria-label="تقديم الصورة"><ArrowRight className="size-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="flex size-7 items-center justify-center rounded-full bg-white/90 text-graphite disabled:opacity-0" aria-label="تأخير الصورة"><ArrowLeft className="size-3.5" /></button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-surface-2"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ))}
        {value.length + uploading < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); void addFiles(e.dataTransfer.files); }}
            className={cn(
              "flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition",
              drag ? "border-primary bg-primary-soft" : error ? "border-danger/50 bg-danger-soft/40" : "border-border-strong bg-surface hover:border-primary/60 hover:bg-primary-soft/30",
              value.length === 0 && "col-span-3 aspect-auto py-10 sm:col-span-4",
            )}
          >
            <ImagePlus className="size-6 text-muted-foreground" />
            <span className="text-[13px] font-semibold">{value.length === 0 ? "أضف صور القطعة" : "أضف المزيد"}</span>
            {value.length === 0 && <span className="text-xs text-muted-foreground">اسحب الصور هنا أو اضغط للاختيار · حتى {max} صور · JPG/PNG/WebP</span>}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic" multiple hidden onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ""; }} />
      {error?.[0] && <p role="alert" className="mt-2 text-[13px] text-danger">{error[0]}</p>}
      <p className="mt-2 text-xs text-muted-foreground">نزيل بيانات الموقع (EXIF) من الصور تلقائيًا لحماية خصوصيتك. الصورة الأولى هي الغلاف.</p>
    </div>
  );
}
