# Saudi phone authentication & SWAP Guard

## 1. Audit of the previous authentication (before this change)

| Area | Found | Risk / gap |
|---|---|---|
| Registration | Public email + password sign-up (`signUp` action) | Anyone, anywhere, unlimited throwaway accounts |
| Sign-in | Email + scrypt password, 10 tries / 15 min (in-memory limiter) | Fine for one instance; limiter resets per serverless instance |
| Sessions | Random 32-byte token in an httpOnly cookie, only its SHA-256 stored, 30 days | Sound — kept as is |
| Authorization | `assertUser` / `assertStaff` on every server action; edge `proxy.ts` only redirects anonymous users | Sound pattern — extended rather than replaced |
| Phone | `profiles.phone`: free-text, unverified, optionally shown publicly | Anyone could publish someone else's number |
| Demo accounts | `@swap.example`, blocked in production unless `ALLOW_DEMO_ACCOUNTS=true` | Kept |
| Trust & safety | Reports, listing moderation queue, inspection reports with a one-time proof code, admin audit log | Reused by SWAP Guard |

## 2. What changed

### Accounts
- **Phone-first, Saudi-only.** `/sign-up` and `/sign-in` are a single flow: enter a Saudi mobile number → SMS code → (new number) complete profile → account. A verified number either opens its account or creates one, so the flow does not reveal whether a number is registered.
- Accepted input: `05XXXXXXXX`, `+9665XXXXXXXX` (also `009665…`, `9665…`, spaces/dashes, Arabic-Indic digits). Stored as E.164 `+9665XXXXXXXX`. Landlines and every non-Saudi number are rejected with a specific Arabic message (`src/lib/phone.ts`).
- **No account exists until the code is verified.** `users.phone` has a partial unique index: one active account per number.
- **Existing users are preserved.** The migration is additive (`drizzle/0002_phone_auth_guard.sql`): email and password become nullable; nothing is deleted or reset. Email accounts keep signing in at `/sign-in/email` and are asked to verify a Saudi number before marketplace actions (`/account/verify-phone`). Email remains optional for recovery/notifications.
- **Public contact number** ("show my number") now always shows the *verified* number; the old free-text value is no longer displayed (kept in the DB, not deleted).

### Eligibility — enforced on the server
A verified Saudi number is the rule (`src/lib/auth/eligibility.ts`, `assertEligible` / `requireEligible`). **There is no IP or country check anywhere.**

| Open to everyone, worldwide | Requires a verified Saudi number |
|---|---|
| Home, categories, listings, search & filters, seller profiles, safety/inspection/help pages | Create/edit/hide/sell listings, uploads of listing/inspection/proof images, messages, price offers, swap offers, favorites & price alerts, inspection reports |

Reporting stays available to every signed-in user, and appeals stay available even to accounts that lost eligibility. The UI routes unverified users to `/account/verify-phone`, but every action re-checks on the server.

### One-time codes (`src/lib/auth/otp-policy.ts`, `src/server/services/otp.ts`)
| Control | Value |
|---|---|
| Code | 6 digits from `crypto.randomInt`, valid 5 min, single use |
| Storage | HMAC-SHA256(`OTP_SECRET`, challengeId + code). The code itself is never stored, logged, returned or rendered |
| Wrong guesses | 5 per code (atomic counter, constant-time compare), then the code is dead |
| Lock | 3 exhausted codes for a number within an hour → no codes for that number for 1 h |
| Resend cooldown | 60 s, doubling within the hour (120, 240 …, max 10 min); countdown shown in the UI |
| Per number | 5 / hour, 10 / day |
| Per IP (HMAC'd, never raw) | 30 / hour, 100 / day — generous because Saudi carriers use CGNAT |
| Site-wide | `SMS_DAILY_CAP` (default 500/day) — cost ceiling |
| Retention | Challenge rows pruned after 30 days |

All limits are counted in Postgres (`phone_otps`), so they hold across serverless instances.

### Number recycling, phone changes, recovery
- **Recycling.** If a verified code arrives for a number whose account has been inactive for 180+ days, SWAP does **not** open the old account with SMS alone. The user may create a fresh account; the number is then released from the old account (which keeps its data, loses eligibility, has its sessions ended and its active listings hidden, and receives an in-app notice). The old owner can recover via email/password (if any) or support.
- **Banned accounts** keep their number blocked (no ban evasion by re-registering).
- **Phone change / first verification** (`/account/verify-phone`): code to the new number; refused if another active account holds it; a dormant holder is released as above. A change ends all other sessions and is written to the audit log with the last 4 digits only.
- **Recovery.** Lost access to the number: email accounts use the existing password reset; phone-only accounts contact support. Deleting a phone-only account requires a sign-in from the last 15 minutes.

## 3. SMS provider — configuration required (nothing is enabled)

Phone sign-up/sign-in is **unavailable** until all of these are true — the pages say so plainly, nothing is faked, and there are no demo codes:

| Variable | Purpose |
|---|---|
| `OTP_SECRET` | 32+ random chars. Required in production (HMAC key for codes and IPs) |
| `SMS_PROVIDER` | `unifonic` (recommended for Saudi Arabia) or `twilio` |
| `UNIFONIC_APP_SID`, `UNIFONIC_SENDER_ID` | Unifonic app + a sender ID registered with the CST (Saudi regulator) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` or `TWILIO_MESSAGING_SERVICE_SID` | Twilio alternative |
| `SMS_DELIVERY_ENABLED=true` | **Explicit approval to send paid SMS.** Default `false` |
| `SMS_DAILY_CAP` | Optional cost ceiling (default 500 codes/day) |

Recommended path: a Unifonic account → register an Arabic/English sender ID (e.g. `SWAP`) with CST → set the variables on the Vercel project → keep `SMS_DELIVERY_ENABLED=false` until a budget is approved → flip it to `true`.

The adapters (`src/lib/sms/requests.ts`) follow each provider's published REST API and their request shapes are unit-tested, **but they have not been exercised against a live account** (no real SMS was sent while building this). Send one test code to an owned number after configuring.

**Test outbox.** `SMS_PROVIDER=outbox` + `ALLOW_TEST_SMS=true` writes codes to `./.sms-outbox/` (gitignored, outside the publicly served `./storage`). It is refused on Vercel, on any non-localhost `APP_URL` and in the visual preview. CI and local E2E use it.

## 4. SWAP Guard

Lightweight, explainable rules — no black box, no escrow, and no claim that identity, ownership, payment or device condition has been verified (that disclaimer is shown wherever Guard speaks).

### Signals (`src/lib/guard/rules.ts`) and consequences
| Signal | Where | Severity | Consequence |
|---|---|---|---|
| `deposit_request` (عربون، دفعة مقدمة، حوّل قبل المعاينة، gift cards…) | message | warn | Sender confirms once; recipient sees a warning and must acknowledge before replying |
| `deposit_request` | listing text | high | Listing held for moderation |
| `repeated_deposit` (deposit requests in 3+ conversations / 24 h) | sender | high | Account queued for moderation |
| `suspicious_link` (shorteners, raw IPs, punycode, `user@host`, SWAP look-alikes) | message / listing | high | Message: warning + account queued. Listing: held |
| `external_link`, `off_platform_contact` (wa.me, t.me, phone numbers, "واتساب") | message | warn | Acknowledge & continue |
| `duplicate_broadcast` (same text already sent to 3 other conversations within an hour) | message | critical | **Blocked** + account queued |
| More than 15 new conversations in an hour | buyer | critical | **Blocked** |
| `image_reuse` (near-duplicate of another account's upload, perceptual dHash ≤ 6 bits) | listing | high | Held + **possession proof** requested |
| `copied_text` (identical description to another seller's listing) | listing | high | Held + possession proof |
| `duplicate_listing` (same seller, same photo, already active) | listing | warn | Held for moderation |
| `new_account_high_value` (< 3 days, ≥ 3,000 SAR) | listing | warn | Held + possession proof |
| `multiple_reports` (3+ fraud reports from verified accounts) | listing | high | Unpublished and held |
| `evidence_reuse` (inspection attachment matches another account's file) | inspection | high | Flag shown to the reviewing moderator |
| `new_seller`, `reported_listing`, `price_outlier` (< 35 % of the category median, ≥ 5 samples) | listing page | warn | Shown to buyers; acknowledged once before messaging/offering |

Held listings cannot be republished by editing or hiding/unhiding — only a moderator decision (or an accepted appeal) releases them.

### Possession proof
A one-time code (`SG-XXXXX`) is shown to the seller, who photographs the item next to the handwritten code and uploads it from `/account/listings/{id}/guard`. The upload must be a fresh file from that seller. A moderator approves (listing published) or rejects (a new code is issued). It shows the seller has the item now — nothing more.

### Moderation, appeals, audit
- `/admin/guard`: open flags, submitted proofs, open appeals. Moderators see signal codes, the account and (for listings) the matched file — **never private message text**.
- Sellers appeal from the listing's Guard page; an accepted appeal clears the flag and republishes when nothing else holds it.
- Every moderator decision goes to `admin_audit_logs`. Guard flags store codes + references, acknowledgements store codes only, OTP rows keep hashes only. Approving a listing from the regular moderation queue also closes its Guard holds.

## 5. Visual preview

The database-free preview (`swap-preview`) shows the auth area as disabled: no phone form, no code field, no email form; SMS availability is hard-wired to "unavailable" in preview mode. Covered by `tests/e2e/preview.mjs` and unit tests.

## 6. Tests

- Unit (`tests/phone-auth.test.ts`, `tests/guard.test.ts`): number normalization (valid / invalid / landline / foreign), eligibility rule, recycling threshold, code hashing & constant-time match, every rate limit and lock, production secret requirement, provider availability matrix (credentials, approval switch, outbox refusal on Vercel/public URL/preview), provider request shapes, Guard text rules (true and false positives), fingerprints, deal warnings, honest copy.
- E2E (`tests/e2e/flows.mjs`): invalid/non-Saudi numbers, full SMS sign-up → profile → features, same number → same account, OTP exhaustion + cooldown + single use + hash-only storage, worldwide browsing (foreign IP header), legacy account blocked from listing/messaging/uploading on the server, number already claimed, recycled number → new account, deposit/link warnings with acknowledgement gate, swap offer warning, image reuse → hold → proof → moderator release.

## 7. Known limitations
- SMS adapters not exercised against a live provider (see §3).
- Other actions (messages, offers, uploads) still use the in-memory per-instance limiter in addition to the DB-backed Guard checks; move it to Redis/Upstash for multi-instance production.
- Image similarity is a linear scan of `media_fingerprints` (fine for tens of thousands of images; add a BK-tree / pgvector index beyond that).
- Possession-proof photos are stored like other uploads (`/api/files`, unguessable URLs, not access-controlled).
- Client IP comes from `x-real-ip` / `x-forwarded-for`, which Vercel sets; behind another proxy, make sure it overwrites these headers.
