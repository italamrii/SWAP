"use client";

import { ArrowRight, CheckCircle2, MessageSquareText, PencilLine, RefreshCw, ShieldAlert, Smartphone } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { phoneAuth, verifyAccountPhone, type PhoneFlowState } from "@/server/actions/phone-auth";

type Mode = "signin" | "signup" | "verify";

const initial: PhoneFlowState = { step: "phone" };

/** Saudi-number sign-in/sign-up (one flow) and the signed-in "verify / change my number" flow. */
export function PhoneAuthFlow({ mode, next, currentMasked }: { mode: Mode; next?: string; currentMasked?: string | null }) {
  const [state, action, pending] = useActionState(mode === "verify" ? verifyAccountPhone : phoneAuth, initial);
  const steps = mode === "verify" ? ["الرقم", "الرمز"] : ["رقم الجوال", "رمز التحقق", "ملفك"];
  const current = state.step === "phone" ? 0 : 1;

  return (
    <div data-testid="phone-auth" data-step={state.step}>
      <ol aria-label="خطوات التحقق" className="mb-6 flex items-center gap-2 text-xs font-semibold">
        {steps.map((label, i) => (
          <li key={label} className={cn("flex items-center gap-2", i <= current ? "text-primary-ink" : "text-subtle-foreground")} aria-current={i === current ? "step" : undefined}>
            <span className={cn("flex size-6 items-center justify-center rounded-full border text-[11px] num", i < current ? "border-primary bg-primary text-primary-foreground" : i === current ? "border-primary text-primary-ink" : "border-border")}>
              {i < current ? <CheckCircle2 className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn(i === current ? "" : "hidden sm:inline")}>{label}</span>
            {i < steps.length - 1 && <span className="h-px w-5 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      {state.step === "phone" && <PhoneStep state={state} action={action} pending={pending} next={next} mode={mode} currentMasked={currentMasked} />}
      {state.step === "code" && <CodeStep state={state} action={action} pending={pending} next={next} />}
      {state.step === "recycled" && <RecycledStep state={state} action={action} pending={pending} next={next} />}
    </div>
  );
}

type StepProps = { state: PhoneFlowState; action: (f: FormData) => void; pending: boolean; next?: string };

function Hidden({ intent, next, phone }: { intent: string; next?: string; phone?: string }) {
  return (
    <>
      <input type="hidden" name="intent" value={intent} />
      {next && <input type="hidden" name="next" value={next} />}
      {phone && <input type="hidden" name="phone" value={phone} />}
    </>
  );
}

function PhoneStep({ state, action, pending, next, mode, currentMasked }: StepProps & { mode: Mode; currentMasked?: string | null }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <Hidden intent="send" next={next} />
      {state.error && <Alert variant="danger"><ShieldAlert />{state.error}</Alert>}
      {mode === "verify" && currentMasked && (
        <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13px] text-muted-foreground">رقمك الموثّق الحالي: <bdi dir="ltr" className="font-semibold text-foreground">{currentMasked}</bdi>. أدخل الرقم الجديد.</p>
      )}
      <Field label="رقم الجوال السعودي" htmlFor="phone" error={state.fieldError} hint="مثال: 0551234567 أو ‎+966551234567‎ — للأرقام السعودية فقط.">
        {/* Numbers read left-to-right: keep the badge and the input padding on the same side. */}
        <div className="relative" dir="ltr">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center gap-1.5 border-e border-border ps-3 pe-2.5 text-sm text-muted-foreground" aria-hidden>
            <Smartphone className="size-4" /> SA
          </span>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="05XXXXXXXX"
            defaultValue={state.phone?.replace(/\s/g, "")}
            maxLength={20}
            className="h-12 ps-[4.5rem] text-start text-base tracking-wide"
            aria-invalid={!!state.fieldError}
            aria-describedby="phone-privacy"
            required
            autoFocus
          />
        </div>
      </Field>
      <p id="phone-privacy" className="text-[12.5px] leading-relaxed text-muted-foreground">
        سنرسل رمز تحقق برسالة SMS. رقمك لا يظهر لأي مستخدم إلا إذا اخترت ذلك من الإعدادات.
      </p>
      <Button type="submit" size="lg" className="w-full" loading={pending}><MessageSquareText />أرسل رمز التحقق</Button>
      {mode !== "verify" && (
        <p className="text-center text-[12.5px] leading-relaxed text-muted-foreground">
          بالمتابعة فإنك توافق على <Link href="/terms" className="font-medium text-primary-ink hover:underline">شروط الاستخدام</Link> و<Link href="/privacy" className="font-medium text-primary-ink hover:underline">سياسة الخصوصية</Link>.
        </p>
      )}
    </form>
  );
}

function CodeStep({ state, action, pending, next }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 p-3.5">
        <MessageSquareText className="mt-0.5 size-5 shrink-0 text-primary-ink" aria-hidden />
        <div className="min-w-0 flex-1 text-sm">
          <p>أرسلنا رمزًا من 6 أرقام إلى <bdi dir="ltr" className="font-semibold">{state.masked}</bdi></p>
          <form action={action} className="mt-1">
            <Hidden intent="edit" next={next} />
            <button type="submit" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-ink hover:underline"><PencilLine className="size-3.5" />تعديل الرقم</button>
          </form>
        </div>
      </div>

      <form action={action} className="space-y-4" noValidate>
        <Hidden intent="verify" next={next} />
        {state.error && <Alert variant="danger" key={state.nonce}><ShieldAlert />{state.error}</Alert>}
        {state.message && !state.error && <Alert variant="success"><CheckCircle2 />{state.message}</Alert>}
        <Field label="رمز التحقق" htmlFor="code" hint="الرمز صالح لمدة 5 دقائق. لا تشاركه مع أي أحد — فريق سواب لن يطلبه منك.">
          <Input
            key={state.nonce}
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            dir="ltr"
            placeholder="••••••"
            className="h-14 text-center text-2xl font-bold tracking-[0.6em] num"
            aria-invalid={!!state.error}
            required
            autoFocus
            onChange={(e) => {
              const digits = e.currentTarget.value.replace(/\D/g, "").slice(0, 6);
              if (digits !== e.currentTarget.value) e.currentTarget.value = digits;
              if (digits.length === 6 && !pending) e.currentTarget.form?.requestSubmit();
            }}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>تحقق ومتابعة</Button>
      </form>

      <form action={action} className="text-center">
        <Hidden intent="send" next={next} phone={state.phone?.replace(/\s/g, "")} />
        <ResendButton key={state.nonce} seconds={state.resendIn ?? 0} pending={pending} />
      </form>
    </div>
  );
}

function ResendButton({ seconds, pending }: { seconds: number; pending: boolean }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={left > 0 || pending} aria-live="polite" data-testid="resend-code">
      <RefreshCw />
      {left > 0 ? <>إعادة الإرسال بعد <span className="num" dir="ltr">{mm}</span></> : "أعد إرسال الرمز"}
    </Button>
  );
}

function RecycledStep({ state, action, pending, next }: StepProps) {
  return (
    <div className="space-y-4" data-testid="recycled-number">
      <Alert variant="warning">
        <ShieldAlert />
        <div>
          <p className="font-semibold">هذا الرقم مرتبط بحساب قديم غير نشط منذ أكثر من 6 أشهر</p>
          <p className="mt-1">قد تكون شركة الاتصالات أعادت تخصيص الرقم. لحماية خصوصية صاحب الحساب القديم لن نفتحه برمز SMS فقط.</p>
        </div>
      </Alert>
      <form action={action}>
        <Hidden intent="new_account" next={next} />
        <Button type="submit" size="lg" className="w-full" loading={pending}>أنشئ حسابًا جديدًا بالرقم <bdi dir="ltr">{state.masked}</bdi></Button>
      </form>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        إنشاء حساب جديد يفصل الرقم عن الحساب القديم (تبقى بياناته محفوظة وتُخفى إعلاناته). إذا كان الحساب القديم لك:
        {" "}<Link href="/sign-in/email" className="font-medium text-primary-ink hover:underline">ادخل بالبريد وكلمة المرور</Link> إن كانت لديك، أو
        {" "}<Link href="/contact" className="font-medium text-primary-ink hover:underline">تواصل مع الدعم</Link>.
      </p>
      <Link href="/sign-in" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"><ArrowRight className="size-3.5" />رجوع</Link>
    </div>
  );
}

export function SmsUnavailable({ legacy = true }: { legacy?: boolean }) {
  return (
    <div className="space-y-4" data-testid="sms-unavailable">
      <Alert variant="warning">
        <ShieldAlert />
        <div>
          <p className="font-semibold">التحقق برقم الجوال غير متاح حاليًا</p>
          <p className="mt-1">خدمة رسائل التحقق لم تُفعّل بعد في هذه البيئة، لذلك إنشاء الحسابات الجديدة والدخول برقم الجوال متوقفان مؤقتًا. التصفح متاح للجميع.</p>
        </div>
      </Alert>
      {legacy && <Link href="/sign-in/email" className="block text-center text-sm font-medium text-primary-ink hover:underline">لديك حساب مسجّل بالبريد؟ ادخل بالبريد الإلكتروني</Link>}
    </div>
  );
}
