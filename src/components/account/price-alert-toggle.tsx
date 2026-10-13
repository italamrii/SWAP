"use client";

import { BellRing } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/checkbox";
import { setPriceAlert } from "@/server/actions/favorites";

export function PriceAlertToggle({ listingId, initial }: { listingId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-[12.5px] text-muted-foreground">
      <span className="flex items-center gap-1.5"><BellRing className="size-3.5" />نبّهني إذا نزل السعر</span>
      <Switch
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          start(async () => {
            const r = await setPriceAlert(listingId, v);
            if (!r.ok) { setOn(!v); toast.error(r.error); }
          });
        }}
      />
    </label>
  );
}
