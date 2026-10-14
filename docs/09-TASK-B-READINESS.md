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

## Remaining blockers (not complete)
- Move possession proof and inspection evidence to **private** object storage with authenticated, expiring access URLs. Current public bucket must not be used for sensitive evidence.
- Add per-device registration, signed attestations, timestamp and nonce replay protection to inspection agent. Keep `INSPECTION_AGENT_ENABLED=false`.
- Add password-reset email delivery and verify sender.
- Database provider, backups, restore exercise, secure object storage, uptime and error monitoring.
- PDPL review, customer support and complaint process.
- Monetization: plan/pricing config, sponsored listing labels, subscription lifecycle, secure payment integration and invoices; payments must remain disabled until a suitable provider is approved.
- Full CI, database migration test, and runtime HTTP checks.
