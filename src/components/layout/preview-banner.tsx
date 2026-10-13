import { FlaskConical } from "lucide-react";

/** Persistent label on every page of the database-free visual preview. */
export function PreviewBanner() {
  return (
    <div role="note" data-testid="preview-banner" className="border-b border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-100">
      <p className="container-page flex items-center justify-center gap-2 py-1.5 text-center text-[12.5px] font-medium">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden />
        معاينة تصميم — كل الإعلانات والأسماء والأسعار والتقارير نموذجية وغير حقيقية. التواصل والعروض وتسجيل الدخول معطّلة.
      </p>
    </div>
  );
}
