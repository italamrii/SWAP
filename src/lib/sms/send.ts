import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { smsAvailability } from "./config";
import { twilioRequest, unifonicRequest } from "./requests";

/** Outside ./storage on purpose: storage is served by /api/files, the outbox must never be. */
export const OUTBOX_DIR = path.join(process.cwd(), ".sms-outbox");

export type SendResult = { ok: true } | { ok: false; retryable: boolean };

/**
 * Deliver one SMS. The body is never logged; failures log the provider and HTTP status only.
 * Adapters follow each provider's published REST API; they have not been exercised against a
 * live account from this repository (no real delivery without explicit approval).
 */
export async function sendSms(toE164: string, body: string): Promise<SendResult> {
  const a = smsAvailability();
  if (!a.available) return { ok: false, retryable: false };
  try {
    if (a.provider === "outbox") {
      await mkdir(OUTBOX_DIR, { recursive: true });
      await writeFile(path.join(OUTBOX_DIR, `${toE164.replace(/\D/g, "")}.json`), JSON.stringify({ to: toE164, body, at: new Date().toISOString() }));
      return { ok: true };
    }
    const res = a.provider === "unifonic" ? await unifonic(toE164, body) : await twilio(toE164, body);
    if (res.ok) return { ok: true };
    console.error(`[sms] ${a.provider} rejected the message: HTTP ${res.status}`);
    return { ok: false, retryable: res.status >= 500 || res.status === 429 };
  } catch (e) {
    console.error(`[sms] ${a.provider} request failed: ${e instanceof Error ? e.name : "error"}`);
    return { ok: false, retryable: true };
  }
}

const TIMEOUT_MS = 10_000;

async function unifonic(to: string, body: string) {
  const r = unifonicRequest(process.env, to, body);
  const res = await fetch(r.url, { ...r.init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return { ok: false, status: res.status };
  // Unifonic answers 200 with {success:false} for some rejections.
  const json = (await res.json().catch(() => null)) as { success?: boolean | string } | null;
  const success = json?.success === true || json?.success === "true";
  return { ok: success, status: success ? 200 : 422 };
}

async function twilio(to: string, body: string) {
  const r = twilioRequest(process.env, to, body);
  const res = await fetch(r.url, { ...r.init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  return { ok: res.ok, status: res.status };
}
