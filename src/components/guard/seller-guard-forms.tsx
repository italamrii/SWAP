"use client";

import { Camera, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/components/listings/form/image-uploader";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { submitAppeal, submitPossessionProof } from "@/server/actions/guard";

export function ProofUpload({ proofId }: { proofId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="صورة إثبات الحيازة"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            const up = await uploadFile(f, "proof");
            setUrl(up.url);
            setPreview(up.url);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "تعذّر الرفع");
          } finally {
            setBusy(false);
          }
        }}
      />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="معاينة صورة الإثبات" className="max-h-64 rounded-xl border border-border object-contain" />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => input.current?.click()} loading={busy}><Camera />{url ? "التقط صورة أخرى" : "التقط أو اختر صورة"}</Button>
        <Button
          type="button"
          disabled={!url}
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await submitPossessionProof({ proofId, imageUrl: url! });
              if (r.ok) { toast.success(r.message); router.refresh(); }
              else toast.error(r.error);
            })
          }
        >
          <Send />أرسل للمراجعة
        </Button>
      </div>
    </div>
  );
}

export function AppealForm({ flagId }: { flagId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await submitAppeal({ flagId, reason });
          if (r.ok) { toast.success(r.message); setReason(""); router.refresh(); }
          else setError(r.error);
        });
      }}
    >
      <Field label="اعتراضك" htmlFor="appeal-reason" error={error} hint="اشرح لماذا ترى أن التنبيه غير صحيح (مثلًا: الصور التقطتها بنفسي، أو الإعلان منقول من حسابي القديم).">
        <Textarea id="appeal-reason" rows={4} maxLength={1500} value={reason} onChange={(e) => { setReason(e.target.value); setError(undefined); }} />
      </Field>
      <Button type="submit" variant="outline" loading={pending} disabled={reason.trim().length < 20}>قدّم الاعتراض</Button>
    </form>
  );
}
