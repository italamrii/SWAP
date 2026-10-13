import { BadgeCheck, CalendarDays, Clock, MessageSquareReply, Package } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cityLabel } from "@/lib/catalog/cities";
import { formatMonthYear } from "@/lib/format";

export function formatResponseTime(minutes: number | null) {
  if (minutes === null) return "—";
  if (minutes < 60) return "خلال ساعة";
  if (minutes < 60 * 6) return "خلال ساعات";
  if (minutes < 60 * 24) return "خلال يوم";
  return "خلال أيام";
}

export function SellerCard({
  seller,
  stats,
}: {
  seller: { username: string; displayName: string; avatarUrl: string | null; city: string | null; createdAt: Date; trusted: boolean; responseRate: number | null; responseTimeMinutes: number | null; completedDeals: number };
  stats: { active: number; sold: number; verified: number };
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <Link href={`/seller/${seller.username}`} className="group flex items-center gap-3">
        <Avatar name={seller.displayName} src={seller.avatarUrl} size={48} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold group-hover:text-primary-ink">{seller.displayName}</span>
            {seller.trusted && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="بائع موثوق" />}
          </div>
          <p className="text-[13px] text-muted-foreground">{seller.city ? cityLabel(seller.city) : ""}{seller.trusted && " · بائع موثوق"}</p>
        </div>
      </Link>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-[13px]">
        <TrustItem icon={CalendarDays} label="عضو منذ" value={formatMonthYear(seller.createdAt)} />
        <TrustItem icon={MessageSquareReply} label="نسبة الرد" value={seller.responseRate !== null ? `${seller.responseRate}%` : "جديد"} />
        <TrustItem icon={Clock} label="يرد عادةً" value={formatResponseTime(seller.responseTimeMinutes)} />
        <TrustItem icon={Package} label="الإعلانات" value={`${stats.active} نشط · ${stats.sold + seller.completedDeals} صفقة`} />
      </dl>
      <Link href={`/seller/${seller.username}`} className="mt-4 block rounded-lg bg-surface-2 py-2 text-center text-[13px] font-semibold transition hover:bg-border/70">
        عرض الملف الشخصي وكل الإعلانات
      </Link>
    </div>
  );
}

function TrustItem({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-muted-foreground"><Icon className="size-3.5" aria-hidden />{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
