import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "استعادة كلمة المرور", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">نسيت كلمة المرور؟</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">أدخل بريدك وبنرسل لك رابطًا لتعيين كلمة مرور جديدة. الرابط صالح 30 دقيقة.</p>
      <ForgotPasswordForm />
      <p className="mt-8 text-center text-sm"><Link href="/sign-in" className="font-semibold text-primary-ink hover:underline">العودة لتسجيل الدخول</Link></p>
    </>
  );
}
