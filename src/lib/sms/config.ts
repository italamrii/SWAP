/**
 * SMS delivery configuration. Pure (no I/O) so the availability rules are unit-tested.
 *
 * Real providers need BOTH their credentials AND `SMS_DELIVERY_ENABLED=true`: the switch is the
 * explicit approval to spend money on SMS. Without it phone sign-up/sign-in stays unavailable —
 * nothing is faked and there is no shared demo code.
 *
 * `outbox` writes codes to a local file for automated tests. It is refused on Vercel, in the
 * visual preview and on any non-localhost APP_URL, so it can never become a public shortcut.
 */
import { isVisualPreview } from "@/lib/preview-mode";

export type SmsProviderName = "unifonic" | "twilio" | "outbox";
type Env = Record<string, string | undefined>;

export type SmsAvailability =
  | { available: true; provider: SmsProviderName }
  | { available: false; reason: "preview" | "not_configured" | "delivery_disabled" | "missing_credentials" | "missing_secret" | "outbox_forbidden" | "unknown_provider"; provider?: string };

const REQUIRED: Record<Exclude<SmsProviderName, "outbox">, string[][]> = {
  unifonic: [["UNIFONIC_APP_SID"], ["UNIFONIC_SENDER_ID"]],
  // Either a sender number or a Messaging Service.
  twilio: [["TWILIO_ACCOUNT_SID"], ["TWILIO_AUTH_TOKEN"], ["TWILIO_FROM", "TWILIO_MESSAGING_SERVICE_SID"]],
};

function isLocalAppUrl(appUrl: string | undefined) {
  try {
    const host = new URL(appUrl ?? "http://localhost:3100").hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function outboxAllowed(env: Env = process.env) {
  return env.ALLOW_TEST_SMS === "true" && env.VERCEL !== "1" && !env.VERCEL_URL && isLocalAppUrl(env.APP_URL) && !isVisualPreview(env);
}

export function smsAvailability(env: Env = process.env): SmsAvailability {
  if (isVisualPreview(env)) return { available: false, reason: "preview" };
  const provider = env.SMS_PROVIDER?.trim().toLowerCase();
  if (!provider) return { available: false, reason: "not_configured" };
  // Codes are HMAC'd with OTP_SECRET; production must not fall back to a known key.
  if (env.NODE_ENV === "production" && (env.OTP_SECRET ?? "").length < 32) return { available: false, reason: "missing_secret", provider };
  if (provider === "outbox") return outboxAllowed(env) ? { available: true, provider: "outbox" } : { available: false, reason: "outbox_forbidden", provider };
  if (!(provider in REQUIRED)) return { available: false, reason: "unknown_provider", provider };
  const name = provider as keyof typeof REQUIRED;
  if (!REQUIRED[name].every((anyOf) => anyOf.some((k) => (env[k] ?? "").trim()))) return { available: false, reason: "missing_credentials", provider };
  if (env.SMS_DELIVERY_ENABLED !== "true") return { available: false, reason: "delivery_disabled", provider };
  return { available: true, provider: name };
}

/** Hard ceiling on codes sent per UTC day across the whole site — bounds cost if limits are bypassed. */
export const smsDailyCap = (env: Env = process.env) => {
  const n = Number(env.SMS_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 500;
};
