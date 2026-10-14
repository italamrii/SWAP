"use client";

import { ArrowLeftRight, Flag, HandCoins, Link2, MessageCircle, Phone, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, InputAdorned, NativeSelect, Textarea } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { CONDITIONS } from "@/lib/catalog/conditions";
import { formatAmount, formatSAR } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/validation/offers";
import { contactSeller } from "@/server/actions/messages";
import { makePriceOffer, makeSwapOffer } from "@/server/actions/offers";
import { reportContent } from "@/server/actions/reports";
import { GuardNotice, useGuardedAction } from "@/components/guard/guard-ui";
import { FavoriteButton } from "./favorite-button";

export interface ListingActionsProps {
  listing: { id: string; slug: string; title: string; price: number; isNegotiable: boolean; acceptsSwap: boolean; swapDetails: string | null };
  signedIn: boolean;
  eligible?: boolean;
  /** SWAP Guard deal warnings for this listing (new seller, reports, unrealistic price). */
  guardWarnings?: string[];
  saved: boolean;
  sellerPhone: string | null;
  myListings: { id: string; title: string }[];
  categories: { id: number; nameAr: string }[];
}

type DialogKind = "message" | "offer" | "swap" | "report" | null;

export function useListingDialogs(signedIn: boolean, slug: string, eligible = false) {
  const router = useRouter();
  const [open, setOpen] = useState<DialogKind>(null);
  const openDialog = (k: Exclude<DialogKind, null>) => {
    const back = encodeURIComponent(`/listing/${slug}`);
    if (!signedIn) {
      router.push(`/sign-in?next=${back}`);
      return;
    }
    // Reporting stays open to every signed-in user; dealing needs a verified Saudi number.
    if (!eligible && k !== "report") {
      router.push(`/account/verify-phone?next=${back}`);
      return;
    }
    setOpen(k);
  };
  return { open, setOpen, openDialog };
}

export function ListingActions(props: ListingActionsProps) {
  const { listing, signedIn, saved, sellerPhone } = props;
  const { open, setOpen, openDialog } = useListingDialogs(signedIn, listing.slug, props.eligible);
  const [showPhone, setShowPhone] = useState(false);

  return (
    <>
      <div className="space-y-2.5">
        <Button size="lg" className="w-full" onClick={() => openDialog("message")}><MessageCircle />راسل البائع</Button>
        <div className={listing.acceptsSwap && listing.isNegotiable ? "grid grid-cols-2 gap-2.5" : "grid gap-2.5"}>
          {listing.isNegotiable && <Button size="lg" variant="outline" onClick={() => openDialog("offer")}><HandCoins />قدّم عرض سعر</Button>}
          {listing.acceptsSwap && <Button size="lg" variant="swap-outline" onClick={() => openDialog("swap")}><ArrowLeftRight />اقترح بدل</Button>}
        </div>
        {sellerPhone && (
          <Button variant="ghost" className="w-full" onClick={() => setShowPhone(true)}>
            <Phone />
            {showPhone ? <a href={`tel:${sellerPhone}`} dir="ltr" className="font-bold">{sellerPhone}</a> : "إظهار رقم الجوال"}
          </Button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <FavoriteButton listingId={listing.id} initialSaved={saved} variant="outline" className="flex-1" />
        <ShareButton title={listing.title} />
        <Button variant="ghost" size="icon" aria-label="الإبلاغ عن الإعلان" onClick={() => openDialog("report")} className="text-muted-foreground"><Flag className="size-4" /></Button>
      </div>
      <ListingDialogs {...props} open={open} setOpen={setOpen} />
    </>
  );
}

export function MobileActionBar(props: ListingActionsProps) {
  const { listing, signedIn } = props;
  const { open, setOpen, openDialog } = useListingDialogs(signedIn, listing.slug, props.eligible);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur lg:hidden pb-safe">
        <div className="flex items-center gap-2">
          <div className="me-auto min-w-0">
            <div className="text-lg font-bold leading-none num" dir="ltr">{formatAmount(listing.price)} <span className="text-xs text-muted-foreground">ر.س</span></div>
            <div className="mt-1 text-[11px] text-muted-foreground">{listing.isNegotiable ? "قابل للتفاوض" : "السعر نهائي"}</div>
          </div>
          {listing.acceptsSwap && <Button variant="swap-outline" onClick={() => openDialog("swap")} aria-label="اقترح بدل"><ArrowLeftRight />بدل</Button>}
          {listing.isNegotiable && !listing.acceptsSwap && <Button variant="outline" onClick={() => openDialog("offer")}><HandCoins />عرض</Button>}
          <Button onClick={() => openDialog("message")}><MessageCircle />راسل</Button>
        </div>
      </div>
      <ListingDialogs {...props} open={open} setOpen={setOpen} />
    </>
  );
}

function ListingDialogs(props: ListingActionsProps & { open: DialogKind; setOpen: (k: DialogKind) => void }) {
  const close = () => props.setOpen(null);
  return (
    <>
      <MessageDialog {...props} isOpen={props.open === "message"} onClose={close} />
      <OfferDialog {...props} isOpen={props.open === "offer"} onClose={close} />
      <SwapDialog {...props} isOpen={props.open === "swap"} onClose={close} />
      <ReportDialog targetType="listing" targetId={props.listing.id} isOpen={props.open === "report"} onClose={close} />
    </>
  );
}

const QUICK_MESSAGES = ["السلام عليكم، هل الإعلان لا يزال متاحًا؟", "ممكن أعاين القطعة قبل الشراء؟", "وش آخر سعر؟", "ممكن صور إضافية أو فيديو وهي تشتغل؟"];

function MessageDialog({ listing, isOpen, onClose, guardWarnings = [] }: ListingActionsProps & { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const guard = useGuardedAction<Awaited<ReturnType<typeof contactSeller>>>((res) => {
    if (!res.ok) return setError(res.error);
    toast.success("وصلت رسالتك للبائع");
    onClose();
    router.push(`/account/messages/${res.data!.conversationId}`);
  });
  const pending = guard.pending;
  const hasPhone = /(?:\+?966|0)?5\d{8}/.test(body.replace(/[\s-]/g, ""));
  function submit() {
    guard.exec((ack) => contactSeller({ listingId: listing.id, body, ack }));
  }
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>راسل البائع</DialogTitle>
          <DialogDescription>بخصوص «{listing.title}». رقمك يبقى مخفيًا.</DialogDescription>
        </DialogHeader>
        <GuardNotice codes={guardWarnings} className="mb-3" />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {QUICK_MESSAGES.map((m) => (
            <button key={m} type="button" onClick={() => setBody(m)} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] transition hover:border-border-strong">{m}</button>
          ))}
        </div>
        <Field error={error} hint={hasPhone ? undefined : "تواصل باحترام ووضّح استفسارك."}>
          <Textarea value={body} onChange={(e) => { setBody(e.target.value); setError(undefined); }} placeholder="اكتب رسالتك…" rows={4} maxLength={2000} aria-label="نص الرسالة" autoFocus />
        </Field>
        {hasPhone && <p className="mt-2 text-[13px] text-warning">تنبيه: يبدو أنك تشارك رقم جوال. ننصح بإبقاء التواصل داخل سواب لحماية خصوصيتك.</p>}
        {guard.inline ?? (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button onClick={submit} loading={pending} disabled={!body.trim()}>إرسال</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OfferDialog({ listing, isOpen, onClose, guardWarnings = [] }: ListingActionsProps & { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const priceSar = Math.round(listing.price / 100);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const guard = useGuardedAction<Awaited<ReturnType<typeof makePriceOffer>>>((res) => {
    if (!res.ok) {
      setErrors(res.fieldErrors ?? { amount: [res.error] });
      return;
    }
    toast.success("أرسلنا عرضك للبائع", { description: "بنبلّغك أول ما يرد." });
    onClose();
    router.push(`/account/messages/${res.data!.conversationId}`);
  });
  const pending = guard.pending;
  const n = Number(amount);
  const diff = n > 0 ? Math.round((1 - n / priceSar) * 100) : 0;
  function submit() {
    guard.exec((ack) => makePriceOffer({ listingId: listing.id, amount, note: note || undefined, ack }));
  }
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>قدّم عرض سعر</DialogTitle>
          <DialogDescription>السعر المطلوب <bdi className="font-semibold text-foreground">{formatSAR(listing.price)}</bdi>. العرض صالح 5 أيام، ويمكنك سحبه قبل رد البائع.</DialogDescription>
        </DialogHeader>
        <GuardNotice codes={guardWarnings} className="mb-3" />
        <Field label="مبلغ عرضك" htmlFor="offer-amount" error={errors.amount} hint={n > 0 && diff > 0 ? `أقل من المطلوب بـ ${diff}%` : undefined}>
          <InputAdorned id="offer-amount" inputMode="numeric" dir="ltr" className="h-12 text-lg font-bold num" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setErrors({}); }} end="ر.س" autoFocus />
        </Field>
        <div className="mt-2.5 flex gap-1.5">
          {[5, 10, 15].map((p) => {
            const v = Math.round((priceSar * (1 - p / 100)) / 10) * 10;
            return <button key={p} type="button" onClick={() => setAmount(String(v))} className="flex-1 rounded-lg border border-border bg-surface-2 py-2 text-[12.5px] font-medium hover:border-border-strong"><bdi className="num">{v.toLocaleString("en-US")}</bdi> <span className="text-muted-foreground">(-{p}%)</span></button>;
          })}
        </div>
        <Field label="رسالة مع العرض" optional className="mt-4">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="مثلًا: أقدر أستلم اليوم بعد العصر" />
        </Field>
        {guard.inline ?? (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button onClick={submit} loading={pending} disabled={!amount}>إرسال العرض</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SwapDialog({ listing, isOpen, onClose, myListings, categories, guardWarnings = [] }: ListingActionsProps & { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ offeredTitle: "", offeredCategoryId: "", offeredCondition: "", offeredDescription: "", offeredListingId: "", cashDirection: "none", cashAmount: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const guard = useGuardedAction<Awaited<ReturnType<typeof makeSwapOffer>>>((res) => {
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success("أرسلنا اقتراح البدل للبائع");
    onClose();
    router.push(`/account/messages/${res.data!.conversationId}`);
  });
  const pending = guard.pending;
  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  function submit() {
    guard.exec((ack) => makeSwapOffer({
        listingId: listing.id,
        offeredTitle: form.offeredTitle,
        offeredCategoryId: form.offeredCategoryId ? Number(form.offeredCategoryId) : undefined,
        offeredCondition: form.offeredCondition as never,
        offeredDescription: form.offeredDescription || undefined,
        offeredListingId: form.offeredListingId || undefined,
        cashDirection: form.cashDirection as "none",
        cashAmount: form.cashAmount ? Number(form.cashAmount) : 0,
        note: form.note || undefined,
        ack,
      }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="size-5 text-swap" />اقترح بدل</DialogTitle>
          <DialogDescription>
            {listing.swapDetails ? <>البائع يدوّر على: <span className="font-medium text-foreground">{listing.swapDetails}</span></> : "وضّح وش تعرض وحالته، وفرق السعر إن وجد."}
          </DialogDescription>
        </DialogHeader>
        <GuardNotice codes={guardWarnings} className="mb-1" />
        <div className="space-y-4">
          {myListings.length > 0 && (
            <Field label="اربطه بأحد إعلاناتك" optional hint="يسهّل على البائع يشوف صور ومواصفات قطعتك.">
              <NativeSelect
                value={form.offeredListingId}
                onChange={(e) => {
                  const l = myListings.find((x) => x.id === e.target.value);
                  set("offeredListingId", e.target.value);
                  if (l && !form.offeredTitle) set("offeredTitle", l.title);
                }}
              >
                <option value="">— بدون ربط —</option>
                {myListings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </NativeSelect>
            </Field>
          )}
          <Field label="القطعة اللي تعرضها" required error={errors.offeredTitle}>
            <Input value={form.offeredTitle} onChange={(e) => set("offeredTitle", e.target.value)} placeholder="مثلًا: RX 7800 XT Sapphire Pulse 16GB" />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
            <Field label="القسم" optional>
              <NativeSelect value={form.offeredCategoryId} onChange={(e) => set("offeredCategoryId", e.target.value)}>
                <option value="">اختر القسم</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </NativeSelect>
            </Field>
            <Field label="الحالة" required error={errors.offeredCondition}>
              <NativeSelect value={form.offeredCondition} onChange={(e) => set("offeredCondition", e.target.value)} aria-invalid={!!errors.offeredCondition}>
                <option value="">اختر الحالة</option>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </NativeSelect>
            </Field>
          </div>
          <Field label="تفاصيل القطعة" optional error={errors.offeredDescription}>
            <Textarea rows={2} value={form.offeredDescription} onChange={(e) => set("offeredDescription", e.target.value)} placeholder="المواصفات، العمر، الضمان، الملحقات…" />
          </Field>
          <Field label="فرق السعر">
            <RadioCards
              value={form.cashDirection}
              onValueChange={(v) => set("cashDirection", v)}
              className="grid-cols-3"
              itemClassName="p-2.5"
              options={[
                { value: "none", label: "بدون فرق" },
                { value: "buyer_pays", label: "أدفع فرق" },
                { value: "seller_pays", label: "يدفع لي فرق" },
              ]}
            />
          </Field>
          {form.cashDirection !== "none" && (
            <Field label="مبلغ الفرق" error={errors.cashAmount}>
              <InputAdorned inputMode="numeric" dir="ltr" className="num" value={form.cashAmount} onChange={(e) => set("cashAmount", e.target.value.replace(/\D/g, ""))} end="ر.س" />
            </Field>
          )}
          <Field label="رسالة للبائع" optional>
            <Textarea rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} maxLength={500} />
          </Field>
        </div>
        {guard.inline ?? (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button variant="swap" onClick={submit} loading={pending}>إرسال اقتراح البدل</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ReportDialog({ targetType, targetId, isOpen, onClose }: { targetType: "listing" | "user"; targetId: string; isOpen: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const reasons = Object.entries(REPORT_REASONS).filter(([k]) => targetType === "user" ? ["scam", "abuse", "other"].includes(k) : k !== "abuse");
  function submit() {
    start(async () => {
      const res = await reportContent({ targetType, targetId, reason, details: details || undefined });
      if (!res.ok) return setError(res.error);
      toast.success(res.message);
      onClose();
      setReason("");
      setDetails("");
    });
  }
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إبلاغ عن {targetType === "user" ? "مستخدم" : "إعلان"}</DialogTitle>
          <DialogDescription>بلاغك سري، ولن يعرف صاحب {targetType === "user" ? "الحساب" : "الإعلان"} هويتك.</DialogDescription>
        </DialogHeader>
        <RadioCards value={reason} onValueChange={(v) => { setReason(v); setError(undefined); }} className="sm:grid-cols-2" itemClassName="p-2.5" options={reasons.map(([value, label]) => ({ value, label }))} />
        <Field label="تفاصيل إضافية" optional className="mt-4" error={error}>
          <Textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="ساعدنا نفهم المشكلة" />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button variant="destructive" onClick={submit} loading={pending} disabled={!reason}>إرسال البلاغ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShareButton({ title }: { title: string }) {
  async function share() {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* cancelled */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("نسخنا رابط الإعلان", { icon: <Link2 className="size-4" /> });
  }
  return <Button variant="outline" size="icon" onClick={share} aria-label="مشاركة الإعلان"><Share2 className="size-4" /></Button>;
}
