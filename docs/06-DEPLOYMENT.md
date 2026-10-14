# Deployment

SWAP deploys independently: its own Postgres, object storage, secrets and pipeline.

## Environments
| Variable | Notes |
|---|---|
| `DATABASE_URL` | Dedicated Postgres 16+. The `pg_trgm` extension is created by the first migration. |
| `APP_URL` | Public origin, e.g. `https://swap.sa`. Used in sitemap, OG and reset links. |
| `STORAGE_DRIVER` | `supabase` in production. `local` only works on a single node with a persistent disk. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | Public bucket for listing photos and inspection evidence. |
| `INSPECTION_AGENT_ENABLED`, `INSPECTION_AGENT_SECRET` | Keep the agent disabled until it ships. |

## Option A: Docker (any host, e.g. a Riyadh or Jeddah region for data residency)
```bash
docker build -t swap-web .
docker build --target migrate -t swap-migrate .
docker run --rm -e DATABASE_URL=$DATABASE_URL swap-migrate      # release step
docker run -d -p 3000:3000 --env-file .env.production swap-web
```
The web image is a Next.js `standalone` build running as a non-root user.

## Option B: Vercel / managed Node
- Build command `pnpm build`, install `pnpm install --frozen-lockfile`.
- Run `pnpm db:migrate:prod` as a pre-deploy step with the production `DATABASE_URL`.
- Use `STORAGE_DRIVER=supabase`, because serverless disks are ephemeral.

## CI
`.github/workflows/ci.yml` runs typecheck, lint and unit tests, then migrates and seeds a throwaway Postgres
service, builds, and runs the Playwright E2E suite against the production server.

## Go-live checklist
- [ ] Run `pnpm db:migrate:prod` (additive migration `0002_phone_auth_guard`; existing users and data are preserved).
- [ ] SMS: `OTP_SECRET`, `SMS_PROVIDER` + credentials and a CST-registered sender ID; set `SMS_DELIVERY_ENABLED=true` only after the SMS budget is approved (see docs/08). Until then phone sign-up shows as unavailable.
- [ ] Never set `ALLOW_TEST_SMS` or `ALLOW_DEMO_ACCOUNTS` on a public deployment.
- [ ] Backups and a tested restore for Postgres; point-in-time recovery enabled.
- [ ] Email provider wired in `requestPasswordReset` (Resend or SES). In dev the link is only logged.
- [ ] Swap the in-memory rate limiter (`src/lib/rate-limit.ts`) for Redis or Upstash when running more than one instance.
- [ ] Error monitoring (Sentry) and uptime checks on `/` and `/api/search/suggest?q=rt`.
- [ ] Review the CSP once analytics or third-party scripts are added.
- [ ] Legal review of the Terms and Privacy pages against PDPL before public launch.
