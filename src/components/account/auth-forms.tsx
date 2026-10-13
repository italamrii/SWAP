"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { CITIES } from "@/lib/catalog/cities";
import { completeOnboarding, requestPasswordReset, resetPassword, signIn, signUp, type FormState } from "@/server/actions/auth";
import { PasswordInput } from "./password-input";

const initial: FormState = {};

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <Field label="البريد الإلكتروني" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!state.fieldErrors?.email} className="text-start" required autoFocus />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" error={state.fieldErrors?.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" aria-invalid={!!state.fieldErrors?.password} required />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-[13px] font-medium text-primary-ink hover:underline">نسيت كلمة المرور؟</Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>تسجيل الدخول</Button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <Field label="الاسم" htmlFor="displayName" error={state.fieldErrors?.displayName} hint="يظهر للمشترين والبائعين.">
        <Input id="displayName" name="displayName" autoComplete="name" defaultValue={state.values?.displayName} aria-invalid={!!state.fieldErrors?.displayName} required autoFocus />
      </Field>
      <Field label="البريد الإلكتروني" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!state.fieldErrors?.email} className="text-start" required />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" error={state.fieldErrors?.password} hint="8 أحرف على الأقل، تتضمن حرفًا ورقمًا.">
        <PasswordInput id="password" name="password" autoComplete="new-password" aria-invalid={!!state.fieldErrors?.password} required />
      </Field>
      <Field error={state.fieldErrors?.terms}>
        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
          <Checkbox name="terms" value="on" className="mt-0.5" />
          <span>أوافق على <Link href="/terms" className="font-medium text-primary-ink underline-offset-2 hover:underline" target="_blank">شروط الاستخدام</Link> و<Link href="/privacy" className="font-medium text-primary-ink underline-offset-2 hover:underline" target="_blank">سياسة الخصوصية</Link>.</span>
        </label>
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>إنشاء الحساب</Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  if (state.ok) {
    return (
      <Alert variant="success"><CheckCircle2 /><div>{state.message}</div></Alert>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="البريد الإلكتروني" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" className="text-start" required autoFocus />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>أرسل رابط إعادة التعيين</Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.error && <Alert variant="danger">{state.error} <Link href="/forgot-password" className="font-semibold underline">طلب رابط جديد</Link></Alert>}
      <Field label="كلمة المرور الجديدة" htmlFor="password" error={state.fieldErrors?.password} hint="8 أحرف على الأقل، تتضمن حرفًا ورقمًا.">
        <PasswordInput id="password" name="password" autoComplete="new-password" required autoFocus />
      </Field>
      <Field label="تأكيد كلمة المرور" htmlFor="confirm" error={state.fieldErrors?.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>حفظ كلمة المرور</Button>
    </form>
  );
}

export function OnboardingForm({ defaults, next }: { defaults: { username: string; displayName: string; city: string }; next?: string }) {
  const [state, action, pending] = useActionState(completeOnboarding, initial);
  const v = { ...defaults, ...state.values };
  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="اسم المستخدم" htmlFor="username" error={state.fieldErrors?.username} hint="رابط ملفك: swap.sa/seller/اسمك">
        <div className="relative">
          <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-subtle-foreground" dir="ltr">@</span>
          <Input id="username" name="username" dir="ltr" defaultValue={v.username} className="ps-8 text-start" aria-invalid={!!state.fieldErrors?.username} required />
        </div>
      </Field>
      <Field label="الاسم الظاهر" htmlFor="displayName" error={state.fieldErrors?.displayName}>
        <Input id="displayName" name="displayName" defaultValue={v.displayName} required />
      </Field>
      <Field label="مدينتك" htmlFor="city" error={state.fieldErrors?.city} hint="تساعد المشترين يعرفون مكان الاستلام.">
        <NativeSelect id="city" name="city" defaultValue={v.city} aria-invalid={!!state.fieldErrors?.city}>
          <option value="">اختر المدينة</option>
          {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </NativeSelect>
      </Field>
      <Field label="نبذة قصيرة" htmlFor="bio" optional error={state.fieldErrors?.bio}>
        <Textarea id="bio" name="bio" rows={3} maxLength={280} placeholder="مثلًا: مجمّع أجهزة من 2018، أبيع قطعي بعد الترقية." defaultValue={state.values?.bio} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>ابدأ استخدام سواب</Button>
    </form>
  );
}
