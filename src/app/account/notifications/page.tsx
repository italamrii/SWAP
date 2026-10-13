import { desc, eq } from "drizzle-orm";
import { ArrowLeftRight, Bell, CheckCheck, Info, MessageSquare, ShieldCheck, Tag, TrendingDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead } from "@/server/actions/notifications";

export const metadata: Metadata = { title: "التنبيهات" };

const ICONS: Record<string, typeof Bell> = { message: MessageSquare, offer: Tag, offer_update: ArrowLeftRight, price_drop: TrendingDown, inspection: ShieldCheck, listing_status: Info, system: Bell };

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(100);
  const unread = rows.filter((r) => !r.readAt).length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="التنبيهات"
        description={unread ? `لديك ${unread} تنبيه غير مقروء.` : "كل شيء مقروء."}
        actions={unread > 0 && <form action={markAllNotificationsRead}><Button variant="outline" type="submit"><CheckCheck />تعليم الكل كمقروء</Button></form>}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد تنبيهات" description="هنا بتوصلك الرسائل الجديدة، العروض، وتنبيهات نزول الأسعار." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          {rows.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <li key={n.id}>
                <Link href={n.href ?? "#"} className={cn("flex items-start gap-3.5 p-4 transition hover:bg-surface-2/60", !n.readAt && "bg-primary-soft/25")}>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", n.type === "price_drop" ? "bg-primary-soft text-primary-ink" : n.type.startsWith("offer") ? "bg-swap-soft text-swap-ink" : "bg-surface-2 text-muted-foreground")}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !n.readAt && "font-semibold")}>{n.title}</p>
                    {n.body && <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{n.body}</p>}
                    <time className="mt-1 block text-xs text-subtle-foreground">{timeAgo(n.createdAt)}</time>
                  </div>
                  {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="غير مقروء" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
