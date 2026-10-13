"use client";

import { CheckCircle2, Eye, EyeOff, Heart, Pencil, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { setListingStatus } from "@/server/actions/listings";

export function OwnerPanel({ listing }: { listing: { id: string; status: string; viewCount: number; favoriteCount: number; verificationLevel: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const change = (status: "active" | "sold" | "hidden") =>
    start(async () => {
      const res = await setListingStatus({ listingId: listing.id, status });
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-surface-2 p-3 text-[13px]">
        <p className="font-semibold">هذا إعلانك</p>
        <div className="mt-2 flex gap-4 text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="size-3.5" />{listing.viewCount} مشاهدة</span>
          <span className="flex items-center gap-1"><Heart className="size-3.5" />{listing.favoriteCount} حفظ</span>
        </div>
      </div>
      <Button asChild size="lg" variant="outline" className="w-full"><Link href={`/account/listings/${listing.id}/edit`}><Pencil />تعديل الإعلان</Link></Button>
      {listing.verificationLevel === "unverified" && (
        <Button asChild size="lg" className="w-full"><Link href={`/account/verification/${listing.id}`}><ShieldCheck />أضف تقرير فحص</Link></Button>
      )}
      {listing.status === "active" && (
        <div className="grid grid-cols-2 gap-2">
          <ConfirmDialog
            title="تعليم الإعلان كمُباع؟"
            description="سيظهر الإعلان كمُباع في ملفك، وستنتهي العروض المعلّقة عليه."
            confirmLabel="نعم، تم البيع"
            onConfirm={() => change("sold")}
            trigger={<Button variant="secondary" disabled={pending}><CheckCircle2 />تم البيع</Button>}
          />
          <Button variant="secondary" disabled={pending} onClick={() => change("hidden")}><EyeOff />إخفاء</Button>
        </div>
      )}
      {(listing.status === "hidden" || listing.status === "sold") && (
        <Button variant="secondary" className="w-full" disabled={pending} onClick={() => change("active")}><Eye />إعادة نشر الإعلان</Button>
      )}
    </div>
  );
}
