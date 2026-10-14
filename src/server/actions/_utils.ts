import "server-only";
import type { ZodError } from "zod";
import { AuthError } from "@/lib/auth/guards";
import { SIGNAL_COPY } from "@/lib/guard/rules";

export type GuardPrompt = { codes: string[]; messages: string[] };
export type Fail = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined>; auth?: boolean; phoneRequired?: boolean; guard?: GuardPrompt };
export type Result<T = undefined> = { ok: true; data?: T; message?: string } | Fail;

export function zodFail(e: ZodError): Fail {
  const fieldErrors = e.flatten().fieldErrors as Record<string, string[] | undefined>;
  const first = Object.values(fieldErrors).flat()[0] ?? e.flatten().formErrors[0];
  return { ok: false, error: first ?? "تحقق من البيانات المدخلة", fieldErrors };
}

/** Wraps an action body: maps auth errors and unexpected failures to friendly results. */
export async function run<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message, auth: e.code === "unauthenticated", phoneRequired: e.code === "phone_required" };
    // Let Next.js redirects / notFound propagate.
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_")) throw e;
    console.error("[action]", e);
    return { ok: false, error: "حدث خطأ غير متوقع. حاول مرة أخرى." };
  }
}

/** A non-critical SWAP Guard warning the user must acknowledge before the action goes through. */
export function guardPrompt(codes: string[]): Fail {
  const unique = [...new Set(codes)];
  return {
    ok: false,
    error: "تنبيه من SWAP Guard — راجع الملاحظات قبل المتابعة",
    guard: { codes: unique, messages: unique.map((c) => `${SIGNAL_COPY[c]?.title ?? c}: ${SIGNAL_COPY[c]?.advice ?? ""}`) },
  };
}
