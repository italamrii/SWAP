import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/auth-forms";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "تعيين كلمة مرور جديدة", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">كلمة مرور جديدة</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">اختر كلمة مرور قوية لم تستخدمها من قبل. سنسجّل خروجك من الأجهزة الأخرى.</p>
      {token ? <ResetPasswordForm token={token} /> : <Alert variant="danger">الرابط غير مكتمل. <Link href="/forgot-password" className="font-semibold underline">اطلب رابطًا جديدًا</Link></Alert>}
    </>
  );
}
