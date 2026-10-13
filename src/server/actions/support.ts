"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { supportTickets } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validation/auth";

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> };

const schema = z.object({
  name: z.string().trim().min(2, "اكتب اسمك").max(60),
  email: emailSchema,
  topic: z.enum(["general", "account", "listing", "inspection", "partnership", "report"], { errorMap: () => ({ message: "اختر موضوع الرسالة" }) }),
  message: z.string().trim().min(15, "اكتب تفاصيل أكثر (15 حرفًا على الأقل)").max(2000),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitContact(_: ContactState, form: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!(await rateLimit(`contact:${ip}`, 5, 3600))) return { error: "أرسلت رسائل كثيرة. حاول بعد قليل." };
  const user = await getCurrentUser();
  const { name, email, topic, message } = parsed.data;
  await db.insert(supportTickets).values({ name, email, topic, message, userId: user?.id ?? null });
  return { ok: true };
}
