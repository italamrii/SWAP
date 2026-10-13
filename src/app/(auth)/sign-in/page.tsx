import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/account/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next, "/account"));
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">أهلًا بعودتك</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">سجّل دخولك لمتابعة رسائلك وعروضك وإعلاناتك.</p>
      <SignInForm next={next ? safeNext(next) : undefined} />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ما عندك حساب؟ <Link href="/sign-up" className="font-semibold text-primary-ink hover:underline">أنشئ حسابًا مجانًا</Link>
      </p>
    </>
  );
}
