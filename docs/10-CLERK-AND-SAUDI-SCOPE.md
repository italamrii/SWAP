# Clerk migration plan — SWAP only (not LAB 16°)

## Goal
Use a **separate Clerk application** for SWAP while keeping all browsing public, requiring a verified **Saudi (+9665...)** mobile number for every interactive marketplace action, and limiting intended sale/swap deals to Saudi Arabia.

## Why a direct auth replacement must not be deployed yet
Existing SWAP user UUIDs are foreign keys in listings, conversations, messages, offers, and moderation records. Never overwrite these IDs with Clerk IDs or delete legacy users.

## Safe migration
1. Create a **new Clerk app specifically for SWAP** (do not reuse LAB 16° keys), and confirm the plan supports production SMS to Saudi numbers, pricing, sending caps and deliverability.
2. Enforce +966 Saudi mobile verification on the **server**, regardless of what Clerk's client components permit. Disable public email-only sign-up and unsupported phone countries. Keep email optional.
3. Store Clerk's external user ID in a nullable, uniquely indexed `users.clerk_user_id` while retaining local UUID as SWAP's canonical key. Backfill through verified account linking with a recent valid SWAP session and a verified Clerk phone, never by matching an unverified phone or email alone.
4. During a bounded migration window keep legacy sign-in behind a guarded route for existing customers only. Do not auto-create duplicate profiles or reset historical trust and listings.
5. Adapt `getCurrentUser`, `assertEligible`, admin authorization, settings, sign out and deletion to the Clerk server session, then test stale/banned sessions, recycled phone numbers and 2-user account collision scenarios.
6. Privacy policy must be revised to identify Clerk as an authentication processor and describe cross-border data transfers, retention, deletion and user rights accurately based on configured regions and contracts.
7. Roll out on staging behind a feature flag. Require database + migration, provider credentials, real-phone SMS smoke test, end-to-end tests and rollback plan before switching production. Never expose secrets in the repo.

## Saudi transaction scope
Allow worldwide read-only browsing. Registration and marketplace actions require verified Saudi numbers. Sellers and buyers must arrange transactions and delivery **inside Saudi Arabia**; hand-to-hand inspection and collection are recommended, never falsely represented as enforced or guaranteed.
SWAP does not custody customer funds. Off-platform messaging and payments are outside SWAP's visibility and anti-fraud tools. Nothing in the Terms should attempt to waive non-excludable obligations or discourage reporting fraud.

## Setup required
- Separate Clerk publishable and secret keys, kept in the deployment secret manager.
- Confirmed Saudi SMS plan and billing approval.
- Database credentials and additive migration, plus separate integration staging app.
- A legal/PDPL review of Clerk's data processing terms.

**Status:** This document is a migration design, not an implemented Clerk authentication integration.
