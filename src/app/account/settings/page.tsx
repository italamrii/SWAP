import { eq } from "drizzle-orm";
import { CheckCircle2, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DangerZone, PrivacyForm, ProfileForm, SecurityForm } from "@/components/account/settings-forms";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { maskPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  const user = await requireUser("/account/settings");
  const { phone: phoneFlag } = await searchParams;
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const masked = user.phoneVerified && user.phone ? maskPhone(user.phone) : null;
  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="ملفك الشخصي، رقم جوالك، خصوصيتك، وأمان حسابك." />
      {phoneFlag === "verified" && <Alert variant="success"><CheckCircle2 />تم توثيق رقم جوالك وتسجيل خروجك من الأجهزة الأخرى.</Alert>}
      <section aria-labelledby="phone-title" className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink"><Smartphone className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="phone-title" className="font-semibold">رقم الجوال</h2>
            {masked ? (
              <p className="mt-0.5 text-sm text-muted-foreground">موثّق: <bdi dir="ltr" className="font-semibold text-foreground" data-testid="verified-phone">{masked}</bdi> — يُستخدم لتسجيل الدخول ولا يظهر لأحد إلا إذا فعّلت ذلك.</p>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">لم توثّق رقمًا بعد. التوثيق مطلوب للنشر والمراسلة وتقديم العروض والمفضلة.</p>
            )}
          </div>
          <Button asChild variant={masked ? "outline" : "primary"}>
            <Link href="/account/verify-phone?next=/account/settings">{masked ? "تغيير الرقم" : "وثّق رقمك"}</Link>
          </Button>
        </div>
      </section>
      <ProfileForm initial={{ displayName: p.displayName, username: p.username, city: p.city ?? "", bio: p.bio ?? "", avatarUrl: p.avatarUrl }} />
      <PrivacyForm initial={{ showPhone: p.showPhone && !!masked, notifyEmail: p.notifyEmail }} maskedPhone={masked} />
      <SecurityForm hasPassword={user.hasPassword} />
      <DangerZone email={user.email} hasPassword={user.hasPassword} />
    </div>
  );
}
