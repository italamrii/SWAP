import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isVisualPreview } from "@/lib/preview-mode";

/**
 * Fixed-window limiter across all serverless instances.
 * Uses a Postgres atomic upsert; the database stores only a hash of the subject.
 * Production fails closed on a store outage rather than silently allowing abuse.
 */
const localBuckets = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowSeconds) || windowSeconds < 1) return false;
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production" && !isVisualPreview()) {
    const now = Date.now();
    const b = localBuckets.get(key);
    if (!b || b.resetAt <= now) {
      localBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      if (localBuckets.size > 10_000) for (const [k, v] of localBuckets) if (v.resetAt <= now) localBuckets.delete(k);
      return true;
    }
    b.count++;
    return b.count <= limit;
  }
  if (!process.env.DATABASE_URL) return false;
  const hashed = createHash("sha256").update(key).digest("hex");
  try {
    const result = await db.execute<{ count: number }>(sql`
      INSERT INTO request_rate_limits ("key", "window_start", "count")
      VALUES (${hashed}, (floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds})::bigint, 1)
      ON CONFLICT ("key", "window_start")
      DO UPDATE SET "count" = request_rate_limits."count" + 1
      RETURNING "count"
    `);
    return Number(result[0]?.count) <= limit;
  } catch {
    // Do not log raw keys (may contain PII); avoid an allow-on-error bypass.
    console.error("[rate-limit] persistent store unavailable");
    return false;
  }
}
