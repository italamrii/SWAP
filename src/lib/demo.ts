/** Seed/demo accounts live on a reserved domain (RFC 2606) so they can never collide with real users. */
export const DEMO_EMAIL_DOMAIN = "swap.example";

export const isDemoEmail = (email: string) => email.trim().toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);

/** Demo accounts are disabled in production unless explicitly allowed (e.g. a private staging box). */
export const demoAccountsBlocked = () => process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_ACCOUNTS !== "true";
