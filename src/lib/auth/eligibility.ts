/**
 * The account eligibility rule: marketplace actions need a verified Saudi mobile number.
 * Where the visitor is browsing from is irrelevant — there is no IP/country check anywhere.
 */
import { isSaudiMobile } from "@/lib/phone";

export type EligibilityInput = { phone: string | null; phoneVerifiedAt: Date | null; status: "active" | "suspended" | "banned" };

export const hasVerifiedSaudiPhone = (u: Pick<EligibilityInput, "phone" | "phoneVerifiedAt">) => isSaudiMobile(u.phone) && u.phoneVerifiedAt != null;

export const isEligible = (u: EligibilityInput | null | undefined) => !!u && u.status === "active" && hasVerifiedSaudiPhone(u);

/** Numbers not used for this long are treated as possibly recycled by the carrier. */
export const DORMANT_DAYS = 180;

export const isDormant = (lastActiveAt: Date, now = new Date()) => now.getTime() - lastActiveAt.getTime() > DORMANT_DAYS * 864e5;
