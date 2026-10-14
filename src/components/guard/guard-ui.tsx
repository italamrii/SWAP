"use client";

import { ShieldAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SIGNAL_COPY } from "@/lib/guard/rules";
import { cn } from "@/lib/utils";

/** What SWAP Guard is not — shown wherever its warnings appear, so nobody reads them as a verification. */
export const GUARD_DISCLAIMER = "SWAP Guard ينبّه لأنماط احتيال شائعة فقط؛ لا يتحقق من هوية الأشخاص أو ملكية الأجهزة أو حالتها أو المدفوعات، ولا يحتفظ بأي أموال.";

export function GuardNotice({ codes, title = "تنبيهات SWAP Guard", className, children }: { codes: string[]; title?: string; className?: string; children?: React.ReactNode }) {
  if (!codes.length) return null;
  return (
    <div role="note" data-testid="guard-notice" className={cn("rounded-xl border border-amber-300/70 bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100", className)}>
      <p className="flex items-center gap-1.5 font-semibold"><ShieldAlert className="size-4 shrink-0" aria-hidden />{title}</p>
      <ul className="mt-2 space-y-1.5">
        {codes.map((c) => (
          <li key={c}><span className="font-semibold">{SIGNAL_COPY[c]?.title ?? c}:</span> {SIGNAL_COPY[c]?.advice}</li>
        ))}
      </ul>
      {children}
      <p className="mt-2 text-[11.5px] opacity-75">{GUARD_DISCLAIMER}</p>
    </div>
  );
}

type GuardFail = { ok: false; error: string; guard?: { codes: string[]; messages: string[] }; phoneRequired?: boolean };
type AnyResult = { ok: true } | GuardFail;

/**
 * Runs an action that may answer with a SWAP Guard prompt. The user sees the warnings and can
 * continue at their discretion (the action is re-sent with `ack: true`) or go back.
 */
export function useGuardedAction<R extends AnyResult>(onDone: (r: R) => void) {
  const [prompt, setPrompt] = useState<{ codes: string[]; retry: () => Promise<R> } | null>(null);
  const [pending, start] = useTransition();
  const exec = (fn: (ack: boolean) => Promise<R>) =>
    start(async () => {
      const r = await fn(false);
      if (!r.ok && (r as GuardFail).guard) {
        setPrompt({ codes: (r as GuardFail).guard!.codes, retry: () => fn(true) });
        return;
      }
      onDone(r);
    });
  const confirm = () => {
    const p = prompt;
    if (!p) return;
    start(async () => {
      const r = await p.retry();
      setPrompt(null);
      onDone(r);
    });
  };
  /** For use inside an existing dialog: replaces its footer while a prompt is pending (no stacked dialogs). */
  const inline = prompt ? (
    <div className="mt-4 space-y-3" data-testid="guard-dialog">
      <GuardNotice codes={prompt.codes} title="قبل أن تتابع — رصد SWAP Guard ما يستحق الانتباه" />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => setPrompt(null)}>رجوع</Button>
        <Button loading={pending} onClick={confirm}>فهمت، متابعة</Button>
      </div>
    </div>
  ) : null;
  const dialog = (
    <Dialog open={!!prompt} onOpenChange={(o) => !o && setPrompt(null)}>
      <DialogContent data-testid="guard-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-warning" />قبل أن تتابع</DialogTitle>
          <DialogDescription>رصد SWAP Guard ما يستحق الانتباه. القرار لك.</DialogDescription>
        </DialogHeader>
        <GuardNotice codes={prompt?.codes ?? []} title="ملاحظات" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setPrompt(null)}>رجوع</Button>
          <Button loading={pending} onClick={confirm}>فهمت، متابعة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return { exec, pending, dialog, inline, prompting: !!prompt };
}
