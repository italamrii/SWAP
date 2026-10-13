import { z } from "zod";

export const emailSchema = z.string({ required_error: "أدخل بريدك الإلكتروني" }).trim().toLowerCase().email("صيغة البريد الإلكتروني غير صحيحة").max(160);

export const passwordSchema = z
  .string({ required_error: "أدخل كلمة المرور" })
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جدًا")
  .regex(/[A-Za-z؀-ۿ]/, "يجب أن تحتوي على حرف واحد على الأقل")
  .regex(/\d/, "يجب أن تحتوي على رقم واحد على الأقل");

export const RESERVED_USERNAMES = ["admin", "swap", "support", "help", "account", "settings", "api", "seller", "listing", "browse", "root", "moderator"];

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "اسم المستخدم 3 أحرف على الأقل")
  .max(24, "اسم المستخدم 24 حرفًا كحد أقصى")
  .regex(/^[a-zA-Z0-9_.]+$/, "استخدم أحرفًا إنجليزية وأرقامًا و _ أو . فقط")
  .refine((u) => !RESERVED_USERNAMES.includes(u.toLowerCase()), "اسم المستخدم محجوز");
