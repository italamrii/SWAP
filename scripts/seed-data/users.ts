import { SAMPLE_PROFILES, type SampleProfile } from "../../src/lib/sample-data/users";

/** Local/CI-only credentials for the fictional sample people. Never shipped in the app bundle. */
const CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: { email: "admin@swap.example", password: "Admin@12345" },
  mod: { email: "mod@swap.example", password: "Mod@12345" },
  demo: { email: "demo@swap.example", password: "Demo@12345" },
  abdullah: { email: "abdullah@swap.example", password: "Seller@12345" },
  reem: { email: "reem@swap.example", password: "Seller@12345" },
  faisal: { email: "faisal@swap.example", password: "Seller@12345" },
  nawaf: { email: "nawaf@swap.example", password: "Seller@12345" },
  sarah: { email: "sarah@swap.example", password: "Seller@12345" },
  mohammed: { email: "mohammed@swap.example", password: "Seller@12345" },
  turki: { email: "turki@swap.example", password: "Seller@12345" },
  lama: { email: "lama@swap.example", password: "Seller@12345" },
  khaled: { email: "khaled@swap.example", password: "Seller@12345" },
  yazeed: { email: "yazeed@swap.example", password: "Seller@12345" },
  hind: { email: "hind@swap.example", password: "Seller@12345" },
};

/**
 * Verified Saudi numbers for the fictional people (local/CI only — demo accounts are blocked in
 * public production and the app refuses to text these numbers through a paid provider).
 * "demo" stays email-only on purpose: it represents an existing account that must still verify a number.
 */
const VERIFIED_PHONES: Record<string, string> = Object.fromEntries(
  Object.keys(CREDENTIALS).filter((k) => k !== "demo").map((k, i) => [k, `+9665000001${String(i + 1).padStart(2, "0")}`]),
);

export type SeedUser = SampleProfile & { email: string; password: string; verifiedPhone?: string };
export const SEED_USERS: SeedUser[] = SAMPLE_PROFILES.map((p) => ({ ...p, ...CREDENTIALS[p.key], verifiedPhone: VERIFIED_PHONES[p.key] }));
