"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleFavorite } from "@/server/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  listingId,
  initialSaved,
  variant = "overlay",
  className,
}: {
  listingId: string;
  initialSaved: boolean;
  variant?: "overlay" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useOptimistic(initialSaved);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      setSaved(!saved);
      const res = await toggleFavorite(listingId);
      if (!res.ok) {
        if (res.auth) {
          toast("سجّل دخولك لحفظ الإعلان", {
            description: "احفظ الإعلانات ونبّهك إذا نزل السعر.",
            action: { label: "تسجيل الدخول", onClick: () => router.push(`/sign-in?next=${encodeURIComponent(location.pathname)}`) },
          });
        } else if (res.phoneRequired) {
          toast(res.error, { action: { label: "وثّق رقمك", onClick: () => router.push(`/account/verify-phone?next=${encodeURIComponent(location.pathname)}`) } });
        } else toast.error(res.error);
        return;
      }
      toast.success(res.saved ? "أُضيف للمفضلة — بنبّهك إذا نزل السعر" : "أُزيل من المفضلة");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "إزالة من المفضلة" : "حفظ في المفضلة"}
      className={cn(
        "inline-flex items-center justify-center transition active:scale-90",
        variant === "overlay" && "size-9 rounded-full bg-white/90 text-graphite shadow-xs backdrop-blur hover:bg-white dark:bg-black/60 dark:text-white",
        variant === "outline" && "h-10 gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-semibold hover:bg-surface-2",
        className,
      )}
    >
      <Heart className={cn("size-[18px] transition", saved && "fill-rose-500 text-rose-500")} />
      {variant === "outline" && <span>{saved ? "محفوظ" : "حفظ"}</span>}
    </button>
  );
}
