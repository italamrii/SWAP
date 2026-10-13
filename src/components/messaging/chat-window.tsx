"use client";

import { ArrowRight, Info, Phone, SendHorizontal, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ListingImage } from "@/components/listings/listing-image";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, formatSAR, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fetchNewMessages, sendMessage } from "@/server/actions/messages";
import type { ThreadMessage } from "@/server/queries/inbox";
import { OfferCard } from "./offer-card";

const POLL_MS = 4000;

export interface ChatWindowProps {
  conversationId: string;
  meId: string;
  role: "buyer" | "seller";
  other: { name: string; username: string };
  listing: { slug: string; title: string; price: number; coverImageUrl: string | null; status: string };
  initialMessages: ThreadMessage[];
  sellerPhone: string | null;
}

export function ChatWindow({ conversationId, meId, role, other, listing, initialMessages, sellerPhone }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  const refresh = useCallback(async () => {
    const r = await fetchNewMessages(conversationId, null);
    if (r.ok && r.data) setMessages(r.data);
  }, [conversationId]);

  // Poll while the tab is visible. Swap for SSE/Realtime without touching the UI.
  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0);
    const id = setInterval(() => document.visibilityState === "visible" && void refresh(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function send() {
    const text = body.trim();
    if (!text) return;
    setBody("");
    atBottom.current = true;
    start(async () => {
      const r = await sendMessage({ conversationId, body: text });
      if (!r.ok) {
        toast.error(r.error);
        setBody(text);
        return;
      }
      if (r.data) setMessages((m) => (m.some((x) => x.id === r.data!.id) ? m : [...m, r.data!]));
      router.refresh();
    });
  }

  const hasPhone = /(?:\+?966|0)?5\d{8}/.test(body.replace(/[\s-]/g, ""));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/account/messages" className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 lg:hidden" aria-label="رجوع للمحادثات"><ArrowRight className="size-5" /></Link>
        <Avatar name={other.name} size={36} />
        <div className="min-w-0 flex-1">
          <Link href={`/seller/${other.username}`} className="block truncate text-sm font-semibold hover:underline">{other.name}</Link>
          <p className="text-xs text-muted-foreground">{role === "buyer" ? "البائع" : "مشترٍ مهتم"}</p>
        </div>
        {sellerPhone && role === "buyer" && (
          <Button asChild variant="outline" size="sm"><a href={`tel:${sellerPhone}`}><Phone />اتصال</a></Button>
        )}
      </div>
      <Link href={`/listing/${listing.slug}`} className="flex items-center gap-3 border-b border-border bg-surface-2/50 px-4 py-2.5 transition hover:bg-surface-2">
        <div className="relative aspect-[4/3] w-14 shrink-0 overflow-hidden rounded-md border border-border"><ListingImage src={listing.coverImageUrl} alt="" sizes="56px" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{listing.title}</p>
          <p className="text-xs text-muted-foreground"><bdi>{formatSAR(listing.price)}</bdi>{listing.status !== "active" && <span className="ms-2 font-semibold text-warning">{listing.status === "sold" ? "تم البيع" : "غير متاح"}</span>}</p>
        </div>
      </Link>

      {/* Messages */}
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-5"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 flex max-w-md items-start gap-2 rounded-xl bg-warning-soft/70 px-3 py-2.5 text-[12.5px] leading-relaxed text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          لا تحوّل أي مبلغ قبل معاينة القطعة. قابل في مكان عام، وأبقِ التواصل داخل سواب.
        </div>
        {messages.map((m, i) => {
          const day = formatDate(m.createdAt);
          const showDay = i === 0 || formatDate(messages[i - 1].createdAt) !== day;
          const mine = m.senderId === meId;
          return (
            <div key={m.id}>
              {showDay && <div className="my-3 text-center"><span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] text-muted-foreground">{day}</span></div>}
              {m.kind === "system" ? (
                <div className="my-2 flex justify-center"><p className="flex max-w-md items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-center text-[12.5px] text-muted-foreground"><Info className="size-3.5 shrink-0" />{m.body}</p></div>
              ) : m.kind === "offer" && m.offer?.id ? (
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <OfferCard message={m} meId={meId} listingPrice={listing.price} onChanged={() => { void refresh(); router.refresh(); }} />
                </div>
              ) : (
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed whitespace-pre-wrap shadow-xs", mine ? "rounded-ee-md bg-primary text-primary-foreground" : "rounded-es-md border border-border bg-surface")}>
                    {m.body}
                    <span className={cn("ms-2 inline-block align-bottom text-[10px]", mine ? "text-primary-foreground/70" : "text-subtle-foreground")}>{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 pb-safe">
        {hasPhone && <p className="mb-2 text-[12px] text-warning">تنبيه: مشاركة رقمك تكشفه للطرف الآخر. ننصح بإبقاء التواصل داخل سواب.</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="اكتب رسالة…"
            aria-label="نص الرسالة"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 [field-sizing:content]"
          />
          <Button type="submit" size="icon" className="size-11 rounded-full" disabled={!body.trim() || pending} aria-label="إرسال">
            <SendHorizontal className="size-5 rtl:-scale-x-100" />
          </Button>
        </form>
      </div>
    </div>
  );
}
