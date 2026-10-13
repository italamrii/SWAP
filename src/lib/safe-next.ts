/** Only allow same-site relative redirects (blocks open redirects like //evil.com or /\evil.com). */
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
