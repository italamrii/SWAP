import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { storeDocument, storeImage } from "@/lib/storage";

const FOLDERS = { listing: "listings", inspection: "inspections", avatar: "avatars" } as const;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "يلزم تسجيل الدخول" }, { status: 401 });
  if (user.status !== "active") return NextResponse.json({ error: "حسابك موقوف" }, { status: 403 });
  if (!(await rateLimit(`upload:${user.id}`, 60, 3600))) return NextResponse.json({ error: "رفعت ملفات كثيرة، حاول بعد قليل" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "listing") as keyof typeof FOLDERS;
  if (!(file instanceof File) || !(kind in FOLDERS)) return NextResponse.json({ error: "ملف غير صالح" }, { status: 400 });

  try {
    const stored = file.type === "application/pdf" && kind === "inspection" ? await storeDocument(file, FOLDERS[kind]) : await storeImage(file, FOLDERS[kind]);
    return NextResponse.json({ url: stored.url, width: stored.width, height: stored.height, kind: stored.contentType === "application/pdf" ? "pdf" : "image" });
  } catch (e) {
    const message = e instanceof Error && /[؀-ۿ]/.test(e.message) ? e.message : "تعذّر معالجة الملف. جرّب صورة JPG أو PNG.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
