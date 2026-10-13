"use client";

import { ArrowDown, ArrowUp, Ban, BadgeCheck, Check, Eye, EyeOff, MoreHorizontal, ShieldOff, UserCheck, UserCog, UserX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox, Switch } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { VERIFICATION_META, type VerificationLevel } from "@/lib/catalog/verification";
import { closeTicket, createSubcategory, deleteBanner, moderateListing, moderateUser, resolveReport, reviewInspection, revokeVerification, saveBanner, updateCategory } from "@/server/actions/admin";

type R = { ok: boolean; error?: string; message?: string };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<R>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "تم");
        after?.();
      } else toast.error(r.error);
      router.refresh();
    });
  return { pending, run };
}

function NoteDialog({ open, onOpenChange, title, description, confirmLabel, destructive, required, onSubmit, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; confirmLabel: string; destructive?: boolean; required?: boolean; onSubmit: (note: string) => void; children?: React.ReactNode }) {
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <Field label="ملاحظة" optional={!required} hint="تُرسل لصاحب الإعلان/التقرير. اكتبها بلطف ووضوح.">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button variant={destructive ? "destructive" : "primary"} disabled={required && !note.trim()} onClick={() => { onSubmit(note.trim()); setNote(""); onOpenChange(false); }}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ListingModeration({ listingId, status, verified }: { listingId: string; status: string; verified: boolean }) {
  const { pending, run } = useRun();
  const [dialog, setDialog] = useState<"reject" | "hide" | "revoke" | null>(null);
  return (
    <div className="flex items-center gap-1.5">
      {status === "pending_review" && (
        <>
          <Button size="sm" loading={pending} onClick={() => run(() => moderateListing({ listingId, decision: "approve" }))}><Check />اعتماد</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setDialog("reject")}><X />رفض</Button>
        </>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-2" aria-label="إجراءات"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
        <DropdownMenuContent>
          {status === "active" && <DropdownMenuItem onSelect={() => setDialog("hide")}><EyeOff />إخفاء</DropdownMenuItem>}
          {(status === "hidden" || status === "rejected") && <DropdownMenuItem onSelect={() => run(() => moderateListing({ listingId, decision: "restore" }))}><Eye />إعادة النشر</DropdownMenuItem>}
          {status !== "pending_review" && status !== "rejected" && <DropdownMenuItem onSelect={() => setDialog("reject")}><X />رفض</DropdownMenuItem>}
          {verified && (<><DropdownMenuSeparator /><DropdownMenuItem variant="danger" onSelect={() => setDialog("revoke")}><ShieldOff />سحب التوثيق</DropdownMenuItem></>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <NoteDialog open={dialog === "reject"} onOpenChange={(o) => !o && setDialog(null)} title="رفض الإعلان" description="سيصل السبب للبائع ليعدّل الإعلان ويعيد إرساله." confirmLabel="رفض الإعلان" destructive required onSubmit={(note) => run(() => moderateListing({ listingId, decision: "reject", note }))} />
      <NoteDialog open={dialog === "hide"} onOpenChange={(o) => !o && setDialog(null)} title="إخفاء الإعلان" confirmLabel="إخفاء" destructive onSubmit={(note) => run(() => moderateListing({ listingId, decision: "hide", note: note || undefined }))} />
      <NoteDialog open={dialog === "revoke"} onOpenChange={(o) => !o && setDialog(null)} title="سحب التوثيق" description="يعود الإعلان «بدون تقرير» ويُسجّل ذلك في سجل التوثيق." confirmLabel="سحب التوثيق" destructive required onSubmit={(reason) => run(() => revokeVerification({ listingId, reason }))} />
    </div>
  );
}

export function UserModeration({ userId, status, trusted, role, viewerIsAdmin }: { userId: string; status: string; trusted: boolean; role: string; viewerIsAdmin: boolean }) {
  const { pending, run } = useRun();
  const [confirmBan, setConfirmBan] = useState(false);
  if (role === "admin") return <span className="text-xs text-muted-foreground">مدير</span>;
  const act = (action: Parameters<typeof moderateUser>[0]["action"]) => run(() => moderateUser({ userId, action }));
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="sm" variant="outline" disabled={pending}><UserCog />إجراءات</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          {trusted ? <DropdownMenuItem onSelect={() => act("untrust")}><BadgeCheck />إلغاء «بائع موثوق»</DropdownMenuItem> : <DropdownMenuItem onSelect={() => act("trust")}><BadgeCheck />تعيين «بائع موثوق»</DropdownMenuItem>}
          {status === "active" ? <DropdownMenuItem onSelect={() => act("suspend")}><UserX />إيقاف مؤقت</DropdownMenuItem> : status === "suspended" ? <DropdownMenuItem onSelect={() => act("unsuspend")}><UserCheck />إعادة التفعيل</DropdownMenuItem> : null}
          {viewerIsAdmin && (
            <>
              <DropdownMenuSeparator />
              {role === "moderator" ? <DropdownMenuItem onSelect={() => act("make_user")}><UserCog />إلغاء صلاحية المشرف</DropdownMenuItem> : <DropdownMenuItem onSelect={() => act("make_moderator")}><UserCog />تعيين مشرفًا</DropdownMenuItem>}
              {status !== "banned" && <DropdownMenuItem variant="danger" onSelect={() => setConfirmBan(true)}><Ban />حظر نهائي</DropdownMenuItem>}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog open={confirmBan} onOpenChange={setConfirmBan} title="حظر المستخدم نهائيًا؟" description="سيتم تسجيل خروجه وإخفاء كل إعلاناته النشطة." confirmLabel="حظر" destructive onConfirm={() => act("ban")} />
    </>
  );
}

export function ReportResolution({ reportId, targetType, status }: { reportId: string; targetType: string; status: string }) {
  const { pending, run } = useRun();
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(targetType === "listing");
  const [suspend, setSuspend] = useState(false);
  if (status === "resolved" || status === "dismissed") return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" onClick={() => setOpen(true)} disabled={pending}><Check />اتخاذ إجراء</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => resolveReport({ reportId, decision: "dismiss", note: "لا توجد مخالفة" }))}>رفض البلاغ</Button>
      {status === "open" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => resolveReport({ reportId, decision: "reviewing" }))}>قيد المراجعة</Button>}
      <NoteDialog open={open} onOpenChange={setOpen} title="معالجة البلاغ" confirmLabel="تأكيد الإجراء" required onSubmit={(note) => run(() => resolveReport({ reportId, decision: "resolve", note, hideListing: hide, suspendUser: suspend }))}>
        <div className="mb-4 space-y-2.5">
          {targetType === "listing" && <label className="flex items-center gap-2.5 text-sm"><Checkbox checked={hide} onCheckedChange={(c) => setHide(c === true)} />إخفاء الإعلان</label>}
          <label className="flex items-center gap-2.5 text-sm"><Checkbox checked={suspend} onCheckedChange={(c) => setSuspend(c === true)} />إيقاف حساب {targetType === "listing" ? "البائع" : "المستخدم"} مؤقتًا</label>
        </div>
      </NoteDialog>
    </div>
  );
}

export function InspectionReview({ inspectionId, requestedLevel, hasAgentData }: { inspectionId: string; requestedLevel: VerificationLevel; hasAgentData: boolean }) {
  const { pending, run } = useRun();
  const rank = { unverified: 0, seller_report: 1, platform_checked: 2, partner_verified: 3 } as const;
  const options = (["seller_report", "platform_checked", "partner_verified"] as const).filter((l) => rank[l] <= rank[requestedLevel] && (l !== "platform_checked" || hasAgentData));
  const [level, setLevel] = useState<string>(options[options.length - 1] ?? "seller_report");
  const [note, setNote] = useState("");
  const [reject, setReject] = useState(false);
  return (
    <div className="space-y-4">
      <Field label="مستوى التوثيق الممنوح" hint="لا يمكن منح مستوى أعلى مما تدعمه الأدلة.">
        <RadioCards value={level} onValueChange={setLevel} options={options.map((l) => ({ value: l, label: VERIFICATION_META[l].label, description: VERIFICATION_META[l].short }))} />
      </Field>
      <Field label="ملاحظة للبائع" optional>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Field>
      <div className="flex gap-2">
        <Button className="flex-1" loading={pending} onClick={() => run(() => reviewInspection({ inspectionId, decision: "approve", level: level as VerificationLevel, note: note || undefined }))}><Check />اعتماد التقرير</Button>
        <Button variant="outline" disabled={pending} onClick={() => setReject(true)}><X />رفض</Button>
      </div>
      <NoteDialog open={reject} onOpenChange={setReject} title="رفض تقرير الفحص" description="وضّح ما ينقص التقرير (مثلًا: صورة كود التحقق غير واضحة)." confirmLabel="رفض التقرير" destructive required onSubmit={(n) => run(() => reviewInspection({ inspectionId, decision: "reject", note: n }))} />
    </div>
  );
}

export function CategoryControls({ id, isActive, featured, nameAr, isRoot, first, last }: { id: number; isActive: boolean; featured: boolean; nameAr: string; isRoot: boolean; first: boolean; last: boolean }) {
  const { pending, run } = useRun();
  const [name, setName] = useState(nameAr);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={(e) => { e.preventDefault(); if (name !== nameAr) run(() => updateCategory({ id, nameAr: name })); }} className="flex items-center gap-1.5">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-40" aria-label="اسم القسم" />
        {name !== nameAr && <Button size="sm" type="submit" loading={pending}>حفظ</Button>}
      </form>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Switch checked={isActive} onCheckedChange={(v) => run(() => updateCategory({ id, isActive: v }))} />مفعّل</label>
      {isRoot && <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Switch checked={featured} onCheckedChange={(v) => run(() => updateCategory({ id, featured: v }))} />مميز بالرئيسية</label>}
      <div className="flex">
        <Button size="icon-sm" variant="ghost" disabled={first || pending} aria-label="تحريك لأعلى" onClick={() => run(() => updateCategory({ id, move: "up" }))}><ArrowUp className="size-4" /></Button>
        <Button size="icon-sm" variant="ghost" disabled={last || pending} aria-label="تحريك لأسفل" onClick={() => run(() => updateCategory({ id, move: "down" }))}><ArrowDown className="size-4" /></Button>
      </div>
    </div>
  );
}

export function AddSubcategory({ parentId }: { parentId: number }) {
  const { pending, run } = useRun();
  const [v, setV] = useState({ nameAr: "", nameEn: "", slug: "" });
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => createSubcategory({ parentId, ...v }), () => setV({ nameAr: "", nameEn: "", slug: "" })); }}>
      <Input className="h-8 w-36" placeholder="الاسم بالعربي" value={v.nameAr} onChange={(e) => setV({ ...v, nameAr: e.target.value })} aria-label="الاسم بالعربي" />
      <Input className="h-8 w-32" dir="ltr" placeholder="English name" value={v.nameEn} onChange={(e) => setV({ ...v, nameEn: e.target.value })} aria-label="English name" />
      <Input className="h-8 w-32" dir="ltr" placeholder="slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value.toLowerCase() })} aria-label="slug" />
      <Button size="sm" variant="outline" type="submit" loading={pending} disabled={!v.nameAr || !v.slug}>إضافة فرعي</Button>
    </form>
  );
}

export function BannerEditor({ banner }: { banner?: { id: string; title: string; body: string | null; href: string | null; tone: string; isActive: boolean } }) {
  const { pending, run } = useRun();
  const [v, setV] = useState({ title: banner?.title ?? "", body: banner?.body ?? "", href: banner?.href ?? "", tone: (banner?.tone ?? "promo") as "info" | "promo" | "warning", isActive: banner?.isActive ?? true });
  const [confirm, setConfirm] = useState(false);
  return (
    <form className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => saveBanner({ id: banner?.id, ...v }), () => !banner && setV({ title: "", body: "", href: "", tone: "promo", isActive: true })); }}>
      <Field label="العنوان"><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
      <Field label="الرابط" optional><Input dir="ltr" className="text-start" placeholder="/verification" value={v.href} onChange={(e) => setV({ ...v, href: e.target.value })} /></Field>
      <Field label="النص" optional className="sm:col-span-2"><Input value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} /></Field>
      <Field label="النوع">
        <NativeSelect value={v.tone} onChange={(e) => setV({ ...v, tone: e.target.value as "promo" })}>
          <option value="promo">ترويجي</option><option value="info">معلومة</option><option value="warning">تنبيه</option>
        </NativeSelect>
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><Switch checked={v.isActive} onCheckedChange={(c) => setV({ ...v, isActive: c })} />ظاهر في الرئيسية</label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" loading={pending}>{banner ? "حفظ" : "إضافة"}</Button>
        {banner && <Button type="button" size="sm" variant="destructive-ghost" onClick={() => setConfirm(true)}>حذف</Button>}
      </div>
      {banner && <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="حذف الإعلان الترويجي؟" confirmLabel="حذف" destructive onConfirm={() => run(() => deleteBanner(banner.id))} />}
    </form>
  );
}

export function CloseTicketButton({ id }: { id: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="outline" loading={pending} onClick={() => run(() => closeTicket(id))}><Check />إغلاق</Button>;
}
