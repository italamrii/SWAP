# SWAP — Architecture & Implementation Plan

## Stack and why

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 App Router** + React 19 + TypeScript | Server Components keep browse and listing pages fast and SEO-friendly. Server Actions remove most API boilerplate for mutations. |
| Styling | **Tailwind CSS v4** + in-house shadcn-style primitives on **Radix** | Accessible primitives (dialogs, sheets, menus) without a heavy UI kit. The tokens live in CSS variables, so dark mode and RTL come for free. |
| DB | **PostgreSQL 16** + **Drizzle ORM** | SQL-first and fully typed, with no codegen runtime and a small serverless footprint. It's the same ORM the parent repo uses, so the team already knows it. Arrays, JSONB and generated `tsvector` are first-class. |
| Auth | **Own session auth** (scrypt + DB sessions, HttpOnly cookies) | Email/password is the MVP need. A DB session table gives instant revocation (bans!) and role checks with no vendor lock-in or per-MAU cost, and works offline in dev. It sits behind `lib/auth` so moving to Better Auth or Clerk later is a contained change. |
| Validation | **Zod** | One schema validates both the client form and the Server Action. Category spec schemas also produce Zod validators. |
| Storage | `lib/storage` adapter: **local disk** in dev, S3-compatible (Supabase Storage/R2) in prod | Uploads are re-encoded with **sharp** (WebP, max 1600px, EXIF stripped for privacy). |
| Realtime | 4s polling of the open thread (visible tabs only) | Good enough at MVP scale and works on any host. The chat client is isolated, so it can move to Supabase Realtime or SSE later. |
| Icons | Lucide | Consistent stroke icons. |

## Folder structure
```
swap/
  docs/                 product + architecture docs
  drizzle/              generated SQL migrations
  scripts/              migrate, seed, reset
  public/               brand + seed illustrations
  src/
    app/
      (site)/           public pages with the marketing header and footer
      (auth)/           sign-in, sign-up, forgot/reset password
      account/          authenticated user area (sidebar layout)
      admin/            moderation and ops (role-gated layout)
      api/              route handlers: uploads, chat polling, search suggestions, files
    components/
      ui/               design-system primitives (button, input, dialog, sheet…)
      brand/            logo and wordmark
      layout/           header, footer, mobile nav, account/admin shells
      listings/         card, grid, filters, gallery, spec table, listing form
      inspection/       verification badge, report view, inspection form
      messaging/        thread list, chat window, offer cards
      shared/           empty state, page header, price, time-ago…
    lib/
      db/               drizzle client + schema
      auth/             sessions, password hashing, guards
      catalog/          categories + per-category spec schemas (single source of truth)
      validation/       zod schemas
      format.ts         SAR, dates, Arabic plurals
    server/
      queries/          read models (listings, sellers, inbox, admin)
      actions/          server actions (mutations), each validated and authorized
```

## Key decisions
- **Category specs are defined in code** (`lib/catalog/specs.ts`): typed fields with labels,
  units, options, a `filterable` flag and groups. The `categories` table holds editable
  presentation (name, order, active) and points to a `schema_key`. Field definitions are
  versioned with the code, while ops can still manage the category tree.
- **Specs are stored twice on purpose.** A `listings.specs` JSONB column is read for display, and
  `listing_attributes` (key, text, numeric, bool) rows are indexed for filtering
  (`EXISTS` subqueries). The JSONB never drives filters, so it can't get out of sync with them.
- **Money in halalas** (integer), formatted as SAR.
- **Offers are a base table plus a `swap_offers` detail table.** One inbox and one status machine cover
  price offers and swap offers.
- **Verification is a ledger.** `listings.verification_level` is a denormalized current
  value. `verification_statuses` is the append-only history, so you can always see who
  granted what, when, and based on which inspection.
- **Listings go through moderation:** a new account's first listings start as `pending_review`, and
  trusted sellers publish directly. Admin actions write to `admin_audit_logs`.
- **Inspection agent ready.** `inspections.source = platform_tool` takes a raw JSON payload
  (`inspection_reports.raw_payload`, `agent_version`, `checksum`). The ingestion endpoint
  `POST /api/inspections/agent` is stubbed behind a feature flag.

## Routes
Public: `/`, `/browse`, `/browse/[category]`, `/listing/[slug]`, `/seller/[username]`,
`/how-it-works`, `/verification`, `/safety`, `/about`, `/contact`, `/terms`, `/privacy`

Auth: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/onboarding`

Account: `/account`, `/account/listings`, `/account/listings/new`, `/account/listings/[id]/edit`,
`/account/messages`, `/account/messages/[id]`, `/account/offers`, `/account/favorites`,
`/account/notifications`, `/account/settings`, `/account/verification`, `/account/verification/[listingId]`

Admin: `/admin`, `/admin/listings`, `/admin/users`, `/admin/reports`, `/admin/inspections`,
`/admin/inspections/[id]`, `/admin/categories`, `/admin/analytics`, `/admin/content`

## Core user flows
1. **Buy:** search or filter → listing → read specs and report → *راسل البائع* or *قدّم عرض سعر*
   → chat → meet safely → seller marks it as sold.
2. **Swap:** listing marked *يقبل البدل* → *اقترح بدل* (item, condition, cash difference and
   who pays it) → the seller accepts, rejects or discusses in chat → both are notified.
3. **Sell:** *أضف إعلان* → pick a category → photos → category-specific specs → price,
   negotiable and swap options → publish (or pending review) → optional inspection.
4. **Verify:** `/account/verification/[listingId]` → structured report form + evidence uploads
   → submit → moderator review (approve with a level, or reject with a note) → badge on the listing.
5. **Moderate:** reports queue → hide the listing or suspend the user → audit log.

## Phases
1. Setup & architecture · 2. DB & auth · 3. Public browse · 4. Listing CRUD ·
5. Messaging & offers · 6. Inspection system · 7. Admin · 8. Polish, SEO and a11y.
