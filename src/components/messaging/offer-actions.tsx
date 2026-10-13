"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { respondToOffer, withdrawOffer } from "@/server/actions/offers";

export function OfferActions({ offerId, direction }: { offerId: string; direction: "received" | "sent" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "تم");
      else toast.error(r.error);
      router.refresh();
    });
  if (direction === "sent") return <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => withdrawOffer(offerId))}>سحب</Button>;
  return (
    <div className="flex gap-1.5">
      <Button size="sm" loading={pending} onClick={() => run(() => respondToOffer({ offerId, decision: "accept" }))}><Check />قبول</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => respondToOffer({ offerId, decision: "reject" }))}><X />رفض</Button>
    </div>
  );
}
