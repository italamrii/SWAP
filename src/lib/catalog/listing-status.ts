export const LISTING_STATUS_META: Record<string, { label: string; variant: "verified" | "warning" | "neutral" | "danger" | "info" }> = {
  active: { label: "نشط", variant: "verified" },
  pending_review: { label: "قيد المراجعة", variant: "warning" },
  sold: { label: "مُباع", variant: "neutral" },
  hidden: { label: "مخفي", variant: "neutral" },
  rejected: { label: "مرفوض", variant: "danger" },
  draft: { label: "مسودة", variant: "info" },
};
