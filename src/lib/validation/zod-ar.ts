import { z } from "zod";

/** Arabic fallback messages so no default English Zod error ever reaches the UI. */
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: issue.received === "undefined" ? "هذا الحقل مطلوب" : "قيمة غير صالحة" };
    case z.ZodIssueCode.too_small:
      return { message: issue.type === "string" ? `يجب ألا يقل عن ${issue.minimum} أحرف` : `القيمة أقل من الحد المسموح` };
    case z.ZodIssueCode.too_big:
      return { message: issue.type === "string" ? `يجب ألا يزيد عن ${issue.maximum} حرفًا` : `القيمة أكبر من الحد المسموح` };
    case z.ZodIssueCode.invalid_string:
      return { message: "صيغة غير صحيحة" };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: "اختر قيمة من القائمة" };
    case z.ZodIssueCode.invalid_date:
      return { message: "تاريخ غير صالح" };
    default:
      return { message: ctx.defaultError === "Required" ? "هذا الحقل مطلوب" : "قيمة غير صالحة" };
  }
});

export { z };
