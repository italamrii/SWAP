import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PhoneAuthFlow, SmsUnavailable } from "@/components/account/phone-auth-flow";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/safe-next";
import { smsAvailability } from "@/lib/sms/config";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next, "/account"));
  const nextPath = next ? safeNext(next) : undefined;
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">ادخل برقم جوالك</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted-foreground">بدون كلمة مرور: نرسل لك رمزًا برسالة SMS. إن لم يكن لديك حساب ننشئه لك بعد التحقق.</p>
      {smsAvailability().available ? <PhoneAuthFlow mode="signin" next={nextPath} /> : <SmsUnavailable legacy={false} />}
      <div className="mt-8 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          حساب قديم مسجّل بالبريد؟{" "}
          <Link href={`/sign-in/email${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="font-semibold text-primary-ink hover:underline">ادخل بالبريد الإلكتروني</Link>
        </p>
      </div>
    </>
  );
}
