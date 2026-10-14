import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { Alert } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth/guards";
import { getUnreadCounts } from "@/server/queries/inbox";

export const metadata: Metadata = { title: { default: "حسابي", template: "%s | حسابي في سواب" }, robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  if (!user.onboarded) redirect("/onboarding?next=/account");
  const counts = await getUnreadCounts(user.id);
  return (
    <>
      <SiteHeader showCategories={false} />
      <div className="container-page pt-6 pb-28 lg:pt-10 lg:pb-16">
        {user.status === "suspended" && (
          <Alert variant="warning" className="mb-6">حسابك موقوف مؤقتًا: لا يمكنك نشر إعلانات أو إرسال رسائل جديدة. تواصل مع الدعم لمعرفة التفاصيل.</Alert>
        )}
        {!user.phoneVerified && user.status !== "banned" && (
          <Alert variant="warning" className="mb-6" data-testid="verify-phone-banner">
            <ShieldCheck />
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
              <span>وثّق رقم جوالك السعودي لتفعيل النشر والمراسلة والعروض والمفضلة.</span>
              <Link href="/account/verify-phone" className="font-semibold underline underline-offset-4">وثّق رقمك الآن</Link>
            </div>
          </Alert>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <AccountNav counts={counts} />
          </aside>
          <main id="main" className="min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
