# سواب · SWAP

> **بيع. بدّل. وثّق.** A Saudi, Arabic-first marketplace for used PCs, laptops, components and
> accessories. It has structured specs per category, built-in swap offers, and optional inspection reports.

SWAP is a standalone product with its own repository, database and deployment.

## What's inside

| Area | Highlights |
|---|---|
| Browse | Category landing pages, full-text plus trigram search with live suggestions, **spec-aware faceted filters** with counts, sorting, pagination, mobile filter sheet |
| Listings | 13 category schemas (GPU VRAM and mining history, laptop battery health, monitor panel and Hz…), a 5-step form with live preview, image uploads re-encoded to WebP with EXIF stripped |
| Trust | 4 verification levels, inspection reports with checklist, temps, SMART and benchmarks, a **per-report verification code photo**, a staleness flag, an audit ledger, and a fixed disclaimer |
| Deals | Private chat (phone hidden by default), price offers, **structured swap offers** with cash difference in either direction, accept/reject/withdraw, offer expiry |
| Accounts | Sign-up/in, onboarding, password reset, profile and privacy settings, favorites with **price-drop alerts**, notifications, account deletion |
| Admin | Moderation queues (listings, inspections, reports, support), user actions (trust, suspend, ban, roles), categories, banners, analytics, audit log |
| Quality | RTL and dark mode, skeletons, empty states, toasts, Arabic validation messages, JSON-LD, sitemap, OG, security headers and CSP, rate limits |

## Stack
Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Radix primitives ·
PostgreSQL 16 + Drizzle ORM · Zod · sharp. Auth is an in-house session system (scrypt and DB-backed
sessions). See [docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md) for the reasoning.

## Getting started
```bash
cp .env.example .env.local          # set DATABASE_URL to a dedicated SWAP database
pnpm install
docker compose up -d                 # or use any Postgres 16
pnpm db:migrate && pnpm db:seed      # schema + realistic Arabic demo data
pnpm dev                             # http://localhost:3100
```

Demo accounts (seed only):

| Role | Email | Password |
|---|---|---|
| Admin | admin@swap.sa | Admin@12345 |
| Moderator | mod@swap.sa | Mod@12345 |
| User (has chats, offers, a listing) | demo@swap.sa | Demo@12345 |
| Seller (trusted) | abdullah@example.com | Seller@12345 |

`pnpm db:reset` drops and rebuilds the local database. It refuses to run in production.

## Scripts
| Command | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev, production build, production server (port 3100) |
| `pnpm check` | typecheck + lint + unit tests |
| `pnpm test` | Unit tests (catalog schemas, filters, auth and security helpers, formatting) |
| `pnpm test:e2e` | Browser E2E flows against a running, freshly seeded server (`BASE=…`) |
| `pnpm db:generate` | Generate a migration from `src/lib/db/schema.ts` |
| `pnpm db:migrate` / `db:migrate:prod` | Apply migrations (tsx / plain node) |

## Project map
```
src/app/(site)       public pages: home, browse, listing, seller, content and legal
src/app/(auth)       sign-in/up, password reset, onboarding
src/app/account      user area: listings, messages, offers, favorites, verification, settings
src/app/admin        moderation and ops console (role-gated)
src/app/api          uploads, files, search suggestions, inspection agent ingestion
src/lib/catalog      categories + spec schemas: the single source for forms, filters and tables
src/lib/db           Drizzle schema and client
src/server           queries (reads) · actions (validated, authorized mutations) · services
docs/                product brief, architecture, design system, research, agent, deployment
```

## Docs
1. [Product brief](docs/01-PRODUCT-BRIEF.md)
2. [Architecture & plan](docs/02-ARCHITECTURE.md)
3. [Design system](docs/03-DESIGN-SYSTEM.md)
4. [Design research → decisions](docs/04-DESIGN-RESEARCH.md)
5. [Inspection agent integration](docs/05-INSPECTION-AGENT.md)
6. [Deployment](docs/06-DEPLOYMENT.md)
