import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { DangerZone, PrivacyForm, ProfileForm, SecurityForm } from "@/components/account/settings-forms";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const user = await requireUser("/account/settings");
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="ملفك الشخصي، خصوصيتك، وأمان حسابك." />
      <ProfileForm initial={{ displayName: p.displayName, username: p.username, city: p.city ?? "", bio: p.bio ?? "", avatarUrl: p.avatarUrl }} />
      <PrivacyForm initial={{ phone: p.phone ?? "", showPhone: p.showPhone, notifyEmail: p.notifyEmail }} />
      <SecurityForm />
      <DangerZone email={user.email} />
    </div>
  );
}
