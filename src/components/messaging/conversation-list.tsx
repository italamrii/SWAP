import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { ListingImage } from "@/components/listings/listing-image";
import { EmptyState } from "@/components/shared/empty-state";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/server/queries/inbox";

export function ConversationList({ items, activeId }: { items: ConversationSummary[]; activeId?: string }) {
  if (items.length === 0) {
    return <EmptyState compact icon={MessageSquare} title="لا توجد محادثات" description="ابدأ محادثة من صفحة أي إعلان بالضغط على «راسل البائع»." className="border-0 bg-transparent" />;
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`/account/messages/${c.id}`} aria-current={c.id === activeId ? "page" : undefined} className={cn("flex gap-3 px-4 py-3.5 transition hover:bg-surface-2/70", c.id === activeId && "bg-primary-soft/40")}>
            <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2">
              <ListingImage src={c.listing.coverImageUrl} alt="" sizes="48px" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate text-sm", c.unread ? "font-bold" : "font-semibold")}>{c.otherName}</p>
                <time className="shrink-0 text-[11px] text-subtle-foreground">{timeAgo(c.lastMessageAt)}</time>
              </div>
              <p className="truncate text-xs text-muted-foreground">{c.listing.title}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className={cn("min-w-0 flex-1 truncate text-[13px]", c.unread ? "font-medium text-foreground" : "text-muted-foreground")}>{c.preview ?? "…"}</p>
                {c.unread && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="غير مقروءة" />}
                <span className={cn("shrink-0 rounded px-1.5 text-[10px] font-semibold", c.role === "seller" ? "bg-swap-soft text-swap-ink" : "bg-surface-2 text-muted-foreground")}>{c.role === "seller" ? "بيع" : "شراء"}</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
