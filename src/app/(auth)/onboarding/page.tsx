import type { Metadata } from "next";
import { OnboardingForm } from "@/components/account/auth-forms";
import { requireUser } from "@/lib/auth/guards";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "أكمل ملفك", robots: { index: false } };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await requireUser("/onboarding");
  const { next } = await searchParams;
  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-primary-ink">
        <span className="flex h-1.5 w-8 rounded-full bg-primary" /><span className="flex h-1.5 w-8 rounded-full bg-primary" /><span>الخطوة الأخيرة</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">خلّنا نعرّف المشترين عليك</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">ملف مكتمل يرفع ثقة المشترين ويزيد الردود على إعلاناتك.</p>
      <OnboardingForm defaults={{ username: user.username ?? "", displayName: user.displayName ?? "", city: user.city ?? "" }} next={next ? safeNext(next) : undefined} />
    </>
  );
}
