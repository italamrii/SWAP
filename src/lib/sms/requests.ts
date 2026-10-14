/** Pure request builders for each SMS provider (unit-tested; no network here). */
type Env = Record<string, string | undefined>;
export type HttpRequest = { url: string; init: { method: "POST"; headers: Record<string, string>; body: URLSearchParams } };

/** Unifonic: form-encoded POST /rest/SMS/messages; recipient in international format without "+". */
export function unifonicRequest(env: Env, to: string, body: string): HttpRequest {
  return {
    url: env.UNIFONIC_BASE_URL ?? "https://el.cloud.unifonic.com/rest/SMS/messages",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ AppSid: env.UNIFONIC_APP_SID ?? "", SenderID: env.UNIFONIC_SENDER_ID ?? "", Recipient: to.replace(/^\+/, ""), Body: body, responseType: "JSON" }),
    },
  };
}

/** Twilio Programmable Messaging: POST /2010-04-01/Accounts/{sid}/Messages.json with basic auth. */
export function twilioRequest(env: Env, to: string, body: string): HttpRequest {
  const sid = env.TWILIO_ACCOUNT_SID ?? "";
  const form = new URLSearchParams({ To: to, Body: body });
  if (env.TWILIO_MESSAGING_SERVICE_SID) form.set("MessagingServiceSid", env.TWILIO_MESSAGING_SERVICE_SID);
  else form.set("From", env.TWILIO_FROM ?? "");
  return {
    url: `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    init: {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN ?? ""}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    },
  };
}
