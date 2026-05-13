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

Tailwind CSS v4 (PostCSS plugin), shadcn-style primitives in `src/components/ui/`, recharts for charts (`src/components/charts/`), lucide-react for icons, `react-hook-form` + `zod` for forms. There is no design-system package — components are local. Use `cn()` from `src/lib/utils/cn.ts` for class merging.
