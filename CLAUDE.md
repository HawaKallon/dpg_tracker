# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js 16 — read docs before writing code

This project runs **Next.js 16.2.4 + React 19.2**. APIs, conventions, and file names have breaking changes vs Next 14/15 (the version most LLM training data covers). Before writing or modifying anything that touches Next.js, consult `node_modules/next/dist/docs/` rather than relying on memory. Notable differences in this repo:

- **No `middleware.ts`** — request interception lives in `proxy.ts` at the repo root, exporting a `proxy` function (see `proxy.ts` + `src/lib/supabase/proxy.ts`).
- `searchParams` in server components is a **Promise** (`type SearchParams = Promise<{ year?: string }>`) and must be awaited.
- App Router only, server components by default.

## Commands

```bash
npm run dev          # next dev — local dev server
npm run build        # next build — production build
npm run start        # next start — serve the production build
npm run lint         # eslint (flat config, ESLint v9)
```

No test runner is configured.

### Database / data scripts

Migrations live under `supabase/migrations/` and are applied manually (Supabase SQL editor or `supabase db push`). Apply them in numeric order — `0003_event_year.sql` adds the `event_year` column and `0004_year_views.sql` replaces the dashboard views with the year-parameterized RPC functions the queries layer expects.

**Nothing tracks which migrations have run, and drift has bitten before.** On 2026-08-02 the live project was found sitting at `0007` while `0016` had been applied out of order: `activities.outcomes/.highlights/.media_urls/.partner_orgs/.age_bands/.roles`, `demographics_taxonomy` and `check_rate_limit()` were all absent, so the admin form dropped those fields on every save. `0018_catchup_0008_to_0017.sql` is the idempotent catch-up. When a save fails on a missing column the action now says so explicitly (`describeDbError`) — never re-introduce a retry loop that strips the column and saves anyway. To check the live schema quickly:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/activities?select=outcomes,media_urls,age_bands&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

```bash
# First admin user (sign-up is closed by default)
npx tsx scripts/create-admin.ts <email> <password> "Full Name"

# Seed from the source spreadsheet
npx tsx scripts/seed-from-xlsx.ts ../DPG\ by\ the\ Numbers.xlsx
```

Both scripts require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (loaded via `dotenv/config`).

Path alias: `@/*` → `./src/*`.

## Architecture

### Two surfaces, one Supabase

The app is a public read-only dashboard plus a gated admin CRUD area, both backed by the same Postgres schema.

- **Public dashboard** (`src/app/page.tsx`) — server-rendered, `revalidate = 60`, anonymous reads via RLS public-select policies.
- **Admin** (`src/app/admin/**`) — every write goes through a `'use server'` Server Action that re-checks `auth.getUser()`. RLS adds a second line of defense (`admin write …` policies gated by an `is_admin()` SQL function reading `public.profiles.role`).
- **Auth gate** is in `proxy.ts` → `updateSession()`: redirects `/admin/*` → `/login` for anon users and `/login` → `/admin` for authed users, while keeping Supabase session cookies refreshed on every request.

### Supabase client factories — pick the right one

`src/lib/supabase/` exports three clients; using the wrong one silently breaks auth or RLS:

| File | Use from | Notes |
|---|---|---|
| `server.ts` → `createClient()` | Server Components, Route Handlers, Server Actions | Reads/writes `cookies()`; this is the default for app code. |
| `server.ts` → `createServiceClient()` | Server-only, special cases | Uses `SUPABASE_SERVICE_ROLE_KEY`, **bypasses RLS**. |
| `client.ts` → `createClient()` | Browser components | Uses `@supabase/ssr`'s `createBrowserClient`. |
| `proxy.ts` → `updateSession()` | The root `proxy.ts` only | Refreshes the session cookie + does the auth redirect. |

### Year-aware queries

The dashboard is filtered by year via `?year=` in the URL. All aggregate queries call Postgres functions (added in migration `0004`) that take `p_year int default null`:

- `dashboard_summary(p_year)` — KPI totals
- `by_sub_project(p_year)`, `by_month(p_year)`, `by_location(p_year)` — chart/feed breakdowns
- `v_years` view — populates the year picker

`src/lib/supabase/queries.ts` is the single layer that calls these. Don't reach into Supabase from page/component code directly — go through `queries.ts`. The mutation side (Server Actions in `src/app/admin/**/actions.ts`) is the only place that calls `.insert/.update/.delete`, and each action also calls `revalidatePath('/')` so the public dashboard picks up changes within 60s.

### Schema shape

`activities` is the fact table; everything else (`sub_projects`, `categories`, `sub_categories`, `locations`) is a lookup. A DB trigger writes every insert/update/delete on `activities` to `audit_log` with the actor's email — the admin "Audit log" page is just a read of that table.

Sub-project → category → sub-category is a strict hierarchy (FKs with `on delete cascade`). The inline-creator Server Actions in `src/app/admin/activities/actions.ts` (`createLocationInline`, `createSubCategoryInline`) exist so the activity form can add lookups without leaving the page.

### UI

Tailwind CSS v4 (PostCSS plugin), shadcn-style primitives in `src/components/ui/`, recharts for charts (`src/components/charts/`), lucide-react for icons. There is no design-system package — components are local. Use `cn()` from `src/lib/utils/cn.ts` for class merging.

Admin forms are plain `<form action={…}>` posting `FormData` to a Server Action — **no `react-hook-form`, no `zod`** despite both being in `package.json`. Validation is HTML attributes plus hand-rolled coercion in the action (`nullable`, `countField`, `stringArray` in `activities/actions.ts`). The activity form uses `useActionState`; the action returns `{ error }` rather than throwing so the form can show it inline. Keep every text field **controlled** — React 19 resets uncontrolled inputs once a form action settles, including on failure, which silently discards long Notes/Outcomes text.

**Photos upload from the browser, not through the Server Action.** `src/lib/supabase/storage-client.ts` writes straight to the `dpg-media` bucket and the form submits public URLs (`media_urls`); the action validates them against `isMediaUrl()`. Files must not go back into the action body — Next caps it at 1 MB by default and Vercel at 4.5 MB, which used to fail the entire "create activity" request as soon as a real photo was attached. `src/lib/utils/image-file.ts` holds the MIME/size rules shared by both sides.

### Caching (Cache Components)

`next.config.ts` enables `cacheComponents: true`. The data-access layer in `src/lib/supabase/queries.ts` uses `'use cache'` + `cacheTag()` + `cacheLife('hours')` on every public read. Cached queries call `createPublicClient()` (anon key, no cookies) because `'use cache'` cannot touch `cookies()` / `headers()` / `searchParams`. Admin Server Actions invalidate via `revalidateTag(...)` — see the tag schema comment at the top of `queries.ts`. Page-level `revalidate = 60` exports have been removed; freshness comes from tag invalidation.

### Observability

Vercel Observability (project dashboard → Observability) is the default for logs / latency / errors — no code changes needed. To add structured error tracking, run `npx @sentry/wizard@latest -i nextjs` interactively; the wizard writes `sentry.{client,server,edge}.config.ts` and wraps `next.config.ts` with `withSentryConfig`. Required env vars: `NEXT_PUBLIC_SENTRY_DSN` (runtime), and `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` (build time only).

### Rate limiting

Admin Server Actions call `rateLimit(userId, bucket, { max })` from `src/lib/security/rate-limit.ts` immediately after `requireAuth()`. Backed by `public.check_rate_limit()` (security-definer RPC in `0012_activity_demographics.sql`). Buckets in use: `activity:write` (20/min), `location:write` (20/min), `sub-project:write` (20/min), `lookup:write` (30–40/min), `admin:invite` (5/min).

### Admin invites

`src/app/admin/users/` lets an existing admin invite teammates by email. `inviteAdmin` (in `users/actions.ts`) re-checks the caller is an admin, then calls `createServiceClient().auth.admin.inviteUserByEmail(...)` — so `SUPABASE_SERVICE_ROLE_KEY` must be set in the runtime env or the action throws. The `handle_new_user` trigger creates the `profiles` row with `role='admin'`. `updateUserRole`/`removeAdmin` toggle the role (service-role write, since `profiles self update` RLS only allows self-edits); the last remaining admin can't be demoted.

**Email delivery requires SMTP.** `inviteUserByEmail` only sends the magic link if the Supabase project has Auth → Email configured (Supabase Studio → Authentication → Email Templates / SMTP). Without it, the auth user is created but no email goes out.

### Location de-duplication

`src/lib/utils/canonical-location.ts` (`LOCATION_ANCHORS`, `canonicalLocationName`, `findMatchingLocation`) collapses venue aliases (e.g. FBC → Fourah Bay College, Limkokwing/LUCT → Limkokwing University of Creative Technology). `createLocation` and `createLocationInline` call it before insert and reuse an existing matching row. One-time DB merge: `0015_dedup_locations_full_names.sql` (idempotent). Keep SQL anchors and TS `LOCATION_ANCHORS` in sync when adding a venue.

**Roles:** `profiles.role` is `super_admin` | `admin` | `viewer`. `is_admin()` (RLS) is true for `admin` and `super_admin`. Only `super_admin` sees `/admin/users` and can invite teammates (`inviteUserByEmail` with `profile_role: admin` in metadata). Promote your account: `npx tsx scripts/promote-super-admin.ts <email>` after migration `0016_super_admin_role.sql`.
