"use client";

import { ArrowLeftRight, Check, HandCoins, X } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { conditionLabel } from "@/lib/catalog/conditions";
import { formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { respondToOffer, withdrawOffer } from "@/server/actions/offers";
import type { ThreadMessage } from "@/server/queries/inbox";

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "بانتظار الرد", className: "bg-warning-soft text-warning" },
  accepted: { label: "مقبول", className: "bg-primary-soft text-primary-ink" },
  rejected: { label: "مرفوض", className: "bg-danger-soft text-danger" },
  withdrawn: { label: "مسحوب", className: "bg-surface-2 text-muted-foreground" },
  expired: { label: "منتهي", className: "bg-surface-2 text-muted-foreground" },
};

export function OfferCard({ message, meId, listingPrice, onChanged }: { message: ThreadMessage; meId: string; listingPrice: number; onChanged: () => void }) {
  const o = message.offer!;
  const [pending, start] = useTransition();
  const isSwap = o.type === "swap";
  const iAmSeller = o.sellerId === meId;
  const st = STATUS[o.status] ?? STATUS.pending;

  const act = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "تم");
      else toast.error(r.error);
      onChanged();
    });

  return (
    <div className={cn("w-full max-w-sm overflow-hidden rounded-2xl border bg-surface shadow-xs", isSwap ? "border-swap/30" : "border-primary/25")}>
      <div className={cn("flex items-center justify-between gap-2 px-4 py-2.5 text-[13px] font-semibold", isSwap ? "bg-swap-soft text-swap-ink" : "bg-primary-soft/60 text-primary-ink")}>
        <span className="flex items-center gap-1.5">{isSwap ? <ArrowLeftRight className="size-4" /> : <HandCoins className="size-4" />}{isSwap ? "اقتراح بدل" : "عرض سعر"}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px]", st.className)}>{st.label}</span>
      </div>
      <div className="space-y-2 p-4 text-sm">
        {isSwap && message.swap?.offeredTitle ? (
          <>
            <p className="font-semibold"><bdi>{message.swap.offeredTitle}</bdi></p>
            <p className="text-[13px] text-muted-foreground">
              {conditionLabel(message.swap.offeredCondition ?? "")}{message.swap.offeredCategory ? ` · ${message.swap.offeredCategory}` : ""}
            </p>
            {message.swap.offeredDescription && <p className="text-[13px] leading-relaxed">{message.swap.offeredDescription}</p>}
            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-[13px]">
              <span className="text-muted-foreground">فرق السعر</span>
              <span className="font-bold">
                {message.swap.cashDirection === "none" ? "بدون فرق" : <>{message.swap.cashDirection === "buyer_pays" ? "المشتري يدفع" : "البائع يدفع"} <bdi>{formatSAR(message.swap.cashAmount ?? 0)}</bdi></>}
              </span>
            </div>
            {message.swap.offeredListingSlug && <Link href={`/listing/${message.swap.offeredListingSlug}`} className="block text-[13px] font-semibold text-swap-ink hover:underline">عرض إعلان القطعة المقترحة ←</Link>}
          </>
        ) : (
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold num" dir="ltr">{formatSAR(o.amount ?? 0)}</span>
            {o.amount && <span className="text-xs text-muted-foreground">من {formatSAR(listingPrice)} ({Math.round((1 - o.amount / listingPrice) * 100)}% أقل)</span>}
          </div>
        )}
        {o.note && <p className="border-t border-border pt-2 text-[13px] text-muted-foreground">«{o.note}»</p>}
      </div>
      {o.status === "pending" && (
        <div className="flex gap-2 border-t border-border p-3">
          {iAmSeller ? (
            <>
              <Button size="sm" className="flex-1" loading={pending} onClick={() => act(() => respondToOffer({ offerId: o.id, decision: "accept" }))}><Check />قبول</Button>
              <Button size="sm" variant="outline" className="flex-1" disabled={pending} onClick={() => act(() => respondToOffer({ offerId: o.id, decision: "reject" }))}><X />رفض</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" loading={pending} onClick={() => act(() => withdrawOffer(o.id))}>سحب العرض</Button>
          )}
        </div>
      )}
    </div>
  );
}
