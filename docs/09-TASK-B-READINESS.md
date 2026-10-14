# Task B — security and commercial launch readiness

## Status
Work is staged in a pull request. **Do not merge or deploy publicly until CI and security review pass.**
No SMS was purchased, no delivery switched on, no production database or LAB 16° modified.

## Saudi SMS — Taqnyat
The existing OTP service accepts `SMS_PROVIDER=taqnyat` after providing:
- `TAQNYAT_BEARER_TOKEN` — secret from the provider account
- `TAQNYAT_SENDER_ID` — approved sender name
- `OTP_SECRET` — 32+ random characters
- `SMS_DELIVERY_ENABLED=true` — remains **off** until explicit cost approval
- `SMS_DAILY_CAP` — start low, e.g. 25/day, then monitor real delivery

The API adapter uses POST https://api.taqnyat.sa/v1/messages, bearer authentication, and international recipients without '+'.
Official API docs: https://dev.taqnyat.sa/en/doc/sms/
**No live delivery has been tested.** Taqnyat accepts a sender name only after registration/approval; contact the provider first.

## Distributed rate limiting
The limiter now uses the `request_rate_limits` table with an atomic PostgreSQL increment.
Apply `0003_request_rate_limits.sql` before serving database-backed traffic.
Production requests fail closed if the database is unavailable.
The local development no-database fallback remains in-memory.
The table is append-only; purge old windows with a scheduled maintenance job (e.g., retain seven days).
Do not enable the new limiter on production until the migration is applied.

## Confidential proof storage rollout
- Create a separate private Supabase Storage bucket for possession proofs and set `SUPABASE_PRIVATE_BUCKET`.
- For new uploads, `proofs/` keys go to this bucket, and clients receive `/api/evidence/proofs/...` instead of a public storage URL.
- The evidence route requires an authenticated active owner or admin/moderator and returns `Cache-Control: private, no-store`.
- The legacy public `/api/files/proofs/...` route is blocked. Public legacy Supabase URLs require separate migration and revocation before go-live. Do not claim historical proof privacy is fixed.
- Review/retention of inspection documents is still pending.

## Remaining blockers (not complete)
- New possession proofs use a **private** storage bucket and authenticated owner/staff-only route. Set `SUPABASE_PRIVATE_BUCKET` to a genuinely private bucket (no public reads, no public policy). Existing proof objects still need migration/revocation from legacy public storage; inspection evidence remains outstanding. For production, private object storage and DB are required.
- Add per-device registration, signed attestations, timestamp and nonce replay protection to inspection agent. Keep `INSPECTION_AGENT_ENABLED=false`.
- Add password-reset email delivery and verify sender.
- Database provider, backups, restore exercise, secure object storage, uptime and error monitoring.
- PDPL review, customer support and complaint process.
- Monetization: plan/pricing config, sponsored listing labels, subscription lifecycle, secure payment integration and invoices; payments must remain disabled until a suitable provider is approved.
- Full CI, database migration test, and runtime HTTP checks.
