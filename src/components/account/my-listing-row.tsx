"use client";

import { CheckCircle2, Eye, EyeOff, Heart, MoreHorizontal, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { VerificationBadge } from "@/components/inspection/verification-badge";
import { ListingImage } from "@/components/listings/listing-image";
import { Price } from "@/components/shared/price";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { VerificationLevel } from "@/lib/catalog/verification";
import { LISTING_STATUS_META as STATUS_META } from "@/lib/catalog/listing-status";
import { timeAgo } from "@/lib/format";
import { deleteListing, setListingStatus } from "@/server/actions/listings";


export interface MyListing {
  id: string; slug: string; title: string; price: number; status: string; coverImageUrl: string | null; categoryIcon: string; categoryNameAr: string;
  verificationLevel: VerificationLevel; viewCount: number; favoriteCount: number; moderationNote: string | null; bumpedAt: Date; pendingInspection: boolean;
}

export function MyListingRow({ l }: { l: MyListing }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = STATUS_META[l.status] ?? STATUS_META.draft;

  const change = (s: "active" | "sold" | "hidden") =>
    start(async () => {
      const res = await setListingStatus({ listingId: l.id, status: s });
      res.ok ? toast.success(res.message) : toast.error(res.error);
      router.refresh();
    });
  const remove = () =>
    start(async () => {
      const res = await deleteListing(l.id);
      res.ok ? toast.success(res.message) : toast.error(res.error);
      router.refresh();
    });

  return (
    <li className={`flex gap-4 p-4 transition ${pending ? "opacity-60" : ""}`}>
      <Link href={`/listing/${l.slug}`} className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 sm:w-32">
        <ListingImage src={l.coverImageUrl} alt={l.title} icon={l.categoryIcon} sizes="128px" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Badge variant={status.variant} size="sm">{status.label}</Badge>
              <VerificationBadge level={l.verificationLevel} size="sm" />
              {l.pendingInspection && <Badge variant="info" size="sm">تقرير قيد المراجعة</Badge>}
            </div>
            <Link href={`/listing/${l.slug}`} className="line-clamp-1 text-[15px] font-semibold hover:text-primary-ink">{l.title}</Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-2" aria-label="خيارات الإعلان"><MoreHorizontal className="size-5" /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href={`/listing/${l.slug}`}><Eye />عرض الإعلان</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={`/account/listings/${l.id}/edit`}><Pencil />تعديل</Link></DropdownMenuItem>
              {l.verificationLevel === "unverified" && !l.pendingInspection && <DropdownMenuItem asChild><Link href={`/account/verification/${l.id}`}><ShieldCheck />أضف تقرير فحص</Link></DropdownMenuItem>}
              {l.status === "active" && <DropdownMenuItem onSelect={() => change("sold")}><CheckCircle2 />تعليم كمُباع</DropdownMenuItem>}
              {l.status === "active" && <DropdownMenuItem onSelect={() => change("hidden")}><EyeOff />إخفاء</DropdownMenuItem>}
              {(l.status === "hidden" || l.status === "sold") && <DropdownMenuItem onSelect={() => change("active")}><Eye />إعادة النشر</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onSelect={() => setConfirmDelete(true)}><Trash2 />حذف نهائي</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Price halalas={l.price} size="sm" />
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="size-3.5" />{l.viewCount}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Heart className="size-3.5" />{l.favoriteCount}</span>
          <span className="text-xs text-subtle-foreground">{l.categoryNameAr} · {timeAgo(l.bumpedAt)}</span>
        </div>
        {l.status === "rejected" && l.moderationNote && <p className="mt-2 rounded-md bg-danger-soft px-2.5 py-1.5 text-[12.5px] text-danger">سبب الرفض: {l.moderationNote}</p>}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="حذف الإعلان نهائيًا؟"
        description="سيُحذف الإعلان وصوره ومحادثاته المرتبطة، ولا يمكن التراجع. إذا بعت القطعة، الأفضل تعليمها كمُباع."
        confirmLabel="حذف نهائي"
        destructive
        onConfirm={remove}
      />
    </li>
  );
}
