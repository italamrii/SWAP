import { readLocal } from "@/lib/storage";

const TYPES: Record<string, string> = { webp: "image/webp", pdf: "application/pdf", png: "image/png", jpg: "image/jpeg" };

/** Serves files from the local storage driver (dev / single-node). Production uses object storage URLs directly. */
export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const path = key.join("/");
  if (!/^[a-z]+\/\d{4}-\d{2}\/[a-z0-9]+\.(webp|pdf)$/.test(path)) return new Response("Not found", { status: 404 });
  const buf = await readLocal(path);
  if (!buf) return new Response("Not found", { status: 404 });
  const ext = path.split(".").pop()!;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": ext === "pdf" ? "inline" : "inline",
    },
  });
}
