import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PhoneAuthFlow, SmsUnavailable } from "@/components/account/phone-auth-flow";
import { getCurrentUser } from "@/lib/auth/session";
import { smsAvailability } from "@/lib/sms/config";

export const metadata: Metadata = { title: "إنشاء حساب", description: "أنشئ حسابك في سواب برقم جوالك السعودي وابدأ البيع والبدل خلال دقائق." };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">أنشئ حسابك في سواب</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted-foreground">التسجيل برقم جوال سعودي فقط — رقم موثّق لكل حساب يرفع الثقة ويحدّ من الاحتيال. التصفح متاح للجميع من أي مكان.</p>
      {smsAvailability().available ? <PhoneAuthFlow mode="signup" /> : <SmsUnavailable legacy={false} />}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        عندك حساب؟ <Link href="/sign-in" className="font-semibold text-primary-ink hover:underline">سجّل دخولك</Link>
      </p>
    </>
  );
}
