import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaFingerprints } from "@/lib/db/schema";
import { readEvidence } from "@/lib/storage";

/** Confidential possession evidence: only uploader or staff may read it. */
export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const storageKey = key.join("/");
  if (!/^proofs\/\d{4}-\d{2}\/[a-z0-9]+\.webp$/.test(storageKey)) return new Response("Not found", { status: 404 });
  const user = await getCurrentUser();
  if (!user || user.status !== "active") return new Response("Unauthorized", { status: 401 });
  const url = `/api/evidence/${storageKey}`;
  const [file] = await db.select({ ownerId: mediaFingerprints.ownerId, kind: mediaFingerprints.kind })
    .from(mediaFingerprints).where(eq(mediaFingerprints.url, url)).limit(1);
  if (!file || file.kind !== "proof") return new Response("Not found", { status: 404 });
  if (file.ownerId !== user.id && user.role !== "admin" && user.role !== "moderator")
    return new Response("Forbidden", { status: 403 });
  const bytes = await readEvidence(storageKey);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
