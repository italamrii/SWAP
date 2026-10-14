import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWindow } from "@/components/messaging/chat-window";
import { ConversationList } from "@/components/messaging/conversation-list";
import { requireUser } from "@/lib/auth/guards";
import { getConversation, getConversations } from "@/server/queries/inbox";
import { acknowledgedCodes } from "@/server/services/guard";

export const metadata: Metadata = { title: "محادثة" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/messages/${id}`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [conv, items, acked] = await Promise.all([getConversation(id, user.id), getConversations(user.id), acknowledgedCodes(user.id, "conversation", id)]);
  if (!conv) notFound();
  const other = conv.role === "buyer" ? { name: conv.sellerName, username: conv.sellerUsername } : { name: conv.buyerName, username: conv.buyerUsername };
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface lg:static lg:z-auto lg:block">
      <div className="grid grid-cols-[minmax(0,1fr)] h-full overflow-hidden lg:h-[calc(100dvh-10rem)] lg:min-h-[560px] lg:grid-cols-[340px_1fr] lg:rounded-2xl lg:border lg:border-border lg:shadow-xs">
        <div className="hidden overflow-y-auto border-e border-border lg:block">
          <ConversationList items={items} activeId={id} />
        </div>
        <ChatWindow
          conversationId={conv.id}
          meId={user.id}
          role={conv.role}
          other={other}
          listing={conv.listing}
          initialMessages={conv.messages}
          sellerPhone={conv.sellerShowPhone ? conv.sellerPhone : null}
          canSend={user.eligible}
          ackedCodes={[...acked]}
        />
      </div>
    </div>
  );
}
