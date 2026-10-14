import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/account/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "الدخول بالبريد الإلكتروني", robots: { index: false } };

/** Existing accounts created before phone-first registration keep their email + password sign-in. */
export default async function EmailSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next, "/account"));
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">الدخول بالبريد الإلكتروني</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">للحسابات المسجّلة قبل التحويل إلى رقم الجوال. بعد الدخول وثّق رقمك السعودي لتفعيل النشر والمراسلة.</p>
      <SignInForm next={next ? safeNext(next) : undefined} />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-semibold text-primary-ink hover:underline">الدخول برقم الجوال</Link>
      </p>
    </>
  );
}
