import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { dhashFromPixels } from "@/lib/guard/rules";
import { shortId } from "@/lib/slug";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];
export const ACCEPTED_DOC_TYPES = ["application/pdf"];

const LOCAL_ROOT = path.join(process.cwd(), "storage");
const driver = process.env.STORAGE_DRIVER ?? "local";

export interface StoredFile {
  url: string;
  key: string;
  width?: number;
  height?: number;
  contentType: string;
  /** 64-bit fingerprint (hex) for SWAP Guard duplicate / evidence-reuse checks: perceptual for images, exact for PDFs. */
  dhash?: string;
}

/** dHash: 9×8 grayscale thumbnail, one bit per horizontal gradient. Robust to resize/re-encode. */
export async function imageFingerprint(input: Buffer): Promise<string> {
  const px = await sharp(input).rotate().grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  return dhashFromPixels(px);
}

async function put(key: string, body: Buffer, contentType: string): Promise<string> {
  if (driver === "supabase") {
    const base = process.env.SUPABASE_URL;
    const keySecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BUCKET ?? "swap";
    if (!base || !keySecret) throw new Error("Supabase storage is not configured");
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${keySecret}`, "Content-Type": contentType, "x-upsert": "false", "Cache-Control": "31536000" },
      body: new Uint8Array(body),
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return `${base}/storage/v1/object/public/${bucket}/${key}`;
  }
  const full = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
  return `/api/files/${key}`;
}

/** Local driver only: read a stored file safely (no path traversal). */
export async function readLocal(key: string): Promise<Buffer | null> {
  const full = path.resolve(LOCAL_ROOT, key);
  if (!full.startsWith(LOCAL_ROOT + path.sep)) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

/**
 * Re-encode an uploaded image: auto-orient, cap at 1600px, WebP, metadata (EXIF/GPS) stripped.
 * Re-encoding also neutralizes polyglot/malformed files.
 */
export async function storeImage(file: File, folder: string): Promise<StoredFile> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("حجم الصورة أكبر من 8 ميجابايت");
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error("صيغة الصورة غير مدعومة");
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const key = `${folder}/${new Date().toISOString().slice(0, 7)}/${shortId(12)}.webp`;
  const url = await put(key, data, "image/webp");
  return { url, key, width: info.width, height: info.height, contentType: "image/webp", dhash: await imageFingerprint(data) };
}

export async function storeDocument(file: File, folder: string): Promise<StoredFile> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("حجم الملف أكبر من 8 ميجابايت");
  if (!ACCEPTED_DOC_TYPES.includes(file.type)) throw new Error("نقبل ملفات PDF فقط");
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString() !== "%PDF-") throw new Error("الملف ليس PDF صالحًا");
  const key = `${folder}/${new Date().toISOString().slice(0, 7)}/${shortId(12)}.pdf`;
  const url = await put(key, buf, "application/pdf");
  // Documents get an exact-content fingerprint (first 64 bits of SHA-256) so re-used evidence is still caught.
  return { url, key, contentType: "application/pdf", dhash: createHash("sha256").update(buf).digest("hex").slice(0, 16) };
}
