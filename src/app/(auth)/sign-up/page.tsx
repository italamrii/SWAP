import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/account/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "إنشاء حساب", description: "أنشئ حسابك في سواب وابدأ البيع والبدل خلال دقائق." };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">أنشئ حسابك في سواب</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">مجاني بالكامل. أضف إعلانك الأول خلال دقائق.</p>
      <SignUpForm />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        عندك حساب؟ <Link href="/sign-in" className="font-semibold text-primary-ink hover:underline">سجّل دخولك</Link>
      </p>
    </>
  );
}
