import type { Metadata } from "next";
import { PhoneAuthFlow, SmsUnavailable } from "@/components/account/phone-auth-flow";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/guards";
import { maskPhone } from "@/lib/phone";
import { safeNext } from "@/lib/safe-next";
import { smsAvailability } from "@/lib/sms/config";

export const metadata: Metadata = { title: "توثيق رقم الجوال" };

export default async function VerifyPhonePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await requireUser("/account/verify-phone");
  const { next } = await searchParams;
  return (
    <div className="max-w-lg">
      <PageHeader
        title={user.phoneVerified ? "تغيير رقم الجوال" : "وثّق رقم جوالك السعودي"}
        description="رقم جوال سعودي موثّق شرط لنشر الإعلانات والمراسلة وتقديم العروض والبدل وحفظ المفضلة. التصفح لا يتطلب أي توثيق."
      />
      <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        {smsAvailability().available ? (
          <PhoneAuthFlow mode="verify" next={next ? safeNext(next) : undefined} currentMasked={user.phoneVerified && user.phone ? maskPhone(user.phone) : null} />
        ) : (
          <SmsUnavailable legacy={false} />
        )}
      </div>
      <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
        لكل رقم حساب نشط واحد. تغيير الرقم يسجّل خروجك من الأجهزة الأخرى، ونحتفظ بسجل مختصر (آخر 4 أرقام فقط) لحماية حسابك.
      </p>
    </div>
  );
}
