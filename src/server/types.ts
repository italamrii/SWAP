import type { VerificationLevel } from "@/lib/catalog/verification";

export interface ListingCardData {
  id: string;
  slug: string;
  title: string;
  price: number;
  city: string;
  condition: string;
  acceptsSwap: boolean;
  isNegotiable: boolean;
  verificationLevel: VerificationLevel;
  coverImageUrl: string | null;
  specs: Record<string, string | number | boolean>;
  status: string;
  publishedAt: Date | null;
  bumpedAt: Date;
  categorySlug: string;
  categoryNameAr: string;
  categoryIcon: string;
  schemaKey: string;
}

export type ActionResult<T = undefined> =
  | ({ ok: true; message?: string } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
