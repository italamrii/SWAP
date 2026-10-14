"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resolveAppeal, reviewGuardFlag, reviewPossessionProof } from "@/server/actions/guard";
import { NoteDialog, useRun } from "./controls";

export function GuardFlagControls({ flagId }: { flagId: string }) {
  const { pending, run } = useRun();
  const [dialog, setDialog] = useState<"clear" | "confirm" | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => setDialog("clear")} loading={pending} data-testid="guard-clear"><Check />لا مخالفة — أفرج</Button>
      <Button size="sm" variant="destructive-ghost" className="border border-danger/30" onClick={() => setDialog("confirm")} loading={pending}><X />تأكيد المخالفة</Button>
      <NoteDialog open={dialog === "clear"} onOpenChange={(o) => !o && setDialog(null)} title="إغلاق التنبيه" description="يُنشر الإعلان إن لم يبقَ ما يحجزه." confirmLabel="إغلاق التنبيه" onSubmit={(note) => run(() => reviewGuardFlag({ flagId, decision: "clear", note: note || undefined }))} />
      <NoteDialog open={dialog === "confirm"} onOpenChange={(o) => !o && setDialog(null)} title="تأكيد المخالفة" description="يُرفض الإعلان ويُبلّغ صاحبه بالسبب، ويحق له الاعتراض." confirmLabel="تأكيد" destructive required onSubmit={(note) => run(() => reviewGuardFlag({ flagId, decision: "confirm", note }))} />
    </div>
  );
}

export function ProofControls({ proofId }: { proofId: string }) {
  const { pending, run } = useRun();
  const [reject, setReject] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => run(() => reviewPossessionProof({ proofId, decision: "approve" }))} loading={pending} data-testid="proof-approve"><Check />الكود والقطعة ظاهران — قبول</Button>
      <Button size="sm" variant="outline" onClick={() => setReject(true)} loading={pending}><X />رفض وطلب صورة جديدة</Button>
      <NoteDialog open={reject} onOpenChange={setReject} title="رفض صورة الإثبات" description="يُطلب من البائع صورة جديدة بكود جديد." confirmLabel="رفض" destructive required onSubmit={(note) => run(() => reviewPossessionProof({ proofId, decision: "reject", note }))} />
    </div>
  );
}

export function AppealControls({ appealId }: { appealId: string }) {
  const { pending, run } = useRun();
  const [dialog, setDialog] = useState<"accept" | "reject" | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => setDialog("accept")} loading={pending}><Check />قبول الاعتراض</Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("reject")} loading={pending}><X />رفض</Button>
      <NoteDialog open={dialog === "accept"} onOpenChange={(o) => !o && setDialog(null)} title="قبول الاعتراض" description="يُلغى التنبيه ويُنشر الإعلان إن لم يبقَ ما يحجزه." confirmLabel="قبول" required onSubmit={(note) => run(() => resolveAppeal({ appealId, decision: "accept", note }))} />
      <NoteDialog open={dialog === "reject"} onOpenChange={(o) => !o && setDialog(null)} title="رفض الاعتراض" confirmLabel="رفض" destructive required onSubmit={(note) => run(() => resolveAppeal({ appealId, decision: "reject", note }))} />
    </div>
  );
}
