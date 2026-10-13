"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { submitContact, type ContactState } from "@/server/actions/support";

export function ContactForm({ defaults }: { defaults: { name: string; email: string } }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, {});
  if (state.ok) return <Alert variant="success"><CheckCircle2 /><div><b>وصلتنا رسالتك.</b> نرد عادةً خلال يوم عمل على بريدك الإلكتروني.</div></Alert>;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم" htmlFor="c-name" error={state.fieldErrors?.name}><Input id="c-name" name="name" defaultValue={defaults.name} /></Field>
        <Field label="البريد الإلكتروني" htmlFor="c-email" error={state.fieldErrors?.email}><Input id="c-email" name="email" type="email" dir="ltr" className="text-start" defaultValue={defaults.email} /></Field>
      </div>
      <Field label="الموضوع" htmlFor="c-topic" error={state.fieldErrors?.topic}>
        <NativeSelect id="c-topic" name="topic" defaultValue="">
          <option value="">اختر الموضوع</option>
          <option value="general">استفسار عام</option>
          <option value="account">مشكلة في الحساب</option>
          <option value="listing">إعلان أو مراجعة إعلان</option>
          <option value="inspection">تقارير الفحص والتوثيق</option>
          <option value="report">اعتراض على إجراء أو بلاغ</option>
          <option value="partnership">شراكة (متاجر فحص وصيانة)</option>
        </NativeSelect>
      </Field>
      <Field label="الرسالة" htmlFor="c-msg" error={state.fieldErrors?.message}><Textarea id="c-msg" name="message" rows={6} maxLength={2000} /></Field>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Button type="submit" size="lg" loading={pending}>إرسال</Button>
    </form>
  );
}
