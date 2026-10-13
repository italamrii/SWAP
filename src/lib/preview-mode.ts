/**
 * Visual preview = a database-free, clearly labeled design preview.
 *
 * It is enabled ONLY when there is no DATABASE_URL and the deployment explicitly
 * opted in — either `SWAP_VISUAL_PREVIEW=1` or the dedicated `swap-preview` Vercel
 * project. Any other production deployment without a database fails loudly instead
 * of silently serving sample data. `SWAP_VISUAL_PREVIEW=0` always disables it.
 */
export function isVisualPreview(env: Record<string, string | undefined> = process.env): boolean {
  if (env.DATABASE_URL) return false;
  if (env.SWAP_VISUAL_PREVIEW === "0") return false;
  if (env.SWAP_VISUAL_PREVIEW === "1") return true;
  if (env.VERCEL !== "1") return false;
  const hosts = [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL];
  return hosts.some((h) => typeof h === "string" && h.toLowerCase().startsWith("swap-preview"));
}
