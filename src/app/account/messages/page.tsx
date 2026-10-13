import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import { ConversationList } from "@/components/messaging/conversation-list";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/guards";
import { getConversations } from "@/server/queries/inbox";

export const metadata: Metadata = { title: "الرسائل" };

export default async function MessagesPage() {
  const user = await requireUser("/account/messages");
  const items = await getConversations(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="الرسائل" description="محادثاتك مع البائعين والمشترين. رقمك يبقى مخفيًا ما لم تختر إظهاره." />
      <div className="grid overflow-hidden rounded-2xl border border-border bg-surface shadow-xs lg:h-[calc(100dvh-14rem)] lg:min-h-[520px] lg:grid-cols-[340px_1fr]">
        <div className="overflow-y-auto lg:border-e lg:border-border">
          <ConversationList items={items} />
        </div>
        <div className="hidden flex-col items-center justify-center p-10 text-center lg:flex">
          <MessagesSquare className="size-10 text-subtle-foreground" />
          <p className="mt-3 font-semibold">اختر محادثة</p>
          <p className="mt-1 text-sm text-muted-foreground">العروض واقتراحات البدل تظهر داخل المحادثة نفسها.</p>
        </div>
      </div>
    </div>
  );
}
