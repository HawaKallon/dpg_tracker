# DPG Tracker — Implementation Plan

## Context

DPG Tracker is the public-facing impact platform for Sierra Leone's Digital Public Goods program. It will be referenced in **funding applications**, so its job is not just to display numbers but to *tell a credible story of impact* — who is being reached, where, by what programs, with what outcomes.

Today the platform is a numerically-correct but narratively-thin dashboard:

- KPI cards always render even when the value is zero.
- "Universities and Hubs" cards have no detail page — funders cannot click through to see what happened at Fourah Bay College vs. Njala University.
- The schema captures **counts** but not **outcomes**, **photos**, **partners**, or **location identity** (logo, description, geography).
- The admin form does not even expose the existing `reach` column — that data only flows through the spreadsheet seed.
- There is no year-over-year comparison, no map, no narrative copy explaining the program itself.

This plan delivers a **three-phase upgrade** that takes the platform from "internal tracker" to "funder-grade impact site" while staying on the current Next.js 16 + Supabase stack.

---

## Decisions & Defaults (call out now)

| Decision | Choice | Why |
|---|---|---|
| Photo storage | **Supabase Storage** (public bucket `dpg-media`) | Already in stack, no new vendor, signed-URL upload from Server Actions |
| Map provider | **react-leaflet + OpenStreetMap tiles** | Free, no API key, sufficient for Sierra Leone-scale markers. Switch to Mapbox only if styling matters |
| Rich-text editor | **Tiptap** (`@tiptap/react` + `@tiptap/starter-kit`) for admin authoring; store as **Tiptap JSON** (jsonb) in Postgres; render server-side with `@tiptap/html` `generateHTML()` | Outcomes, descriptions, and highlights need formatting (headings, bold, lists, links, quotes). Tiptap is headless and integrates cleanly with our shadcn-style components. JSON storage avoids HTML-sanitization risk at write time and keeps round-tripping lossless. See https://tiptap.dev/docs/editor/getting-started/overview |
| Detail pages | **Public**, `revalidate = 60` like the dashboard | Funders share links; gating defeats the purpose |
| Slugs | Add `slug` to `locations` and `sub_projects` | URLs like `/locations/fourah-bay-college` not `/locations/uuid…` |
| Backwards compat | All new schema columns **nullable** | Existing rows keep working; UI degrades gracefully when fields are empty |
| File naming | One file: `implementation_plan.md` at repo root, sectioned by phase | Single source of truth, easy to share with funders/team |

---

## Phase 1 — Polish & Foundations (Quick wins, ~1 week)

Goal: every page that already exists looks and reads sharper, and the admin can finally capture `reach`. No schema changes that block other work.

### 1.1 Conditional KPI cards
- File: `src/app/page.tsx` (lines 75–84) + `src/components/kpi-card.tsx`
- Skip rendering when `value === 0 || value == null`. Hide the wrapper, not just the number — empty grid cells look broken.
- Edge case: `Female %` should hide when `total_count === 0`, not when the percent is 0.

### 1.2 Year-over-year deltas on KPI cards
- New RPC: `dashboard_summary_compare(p_year int)` returning current + prior year totals.
- Extend `kpi-card.tsx` with an optional `delta` prop → renders `▲ 23%` / `▼ 8%` in muted text.
- Reuse the existing `getDashboardSummary` query path in `src/lib/supabase/queries.ts`.

### 1.3 Narrative hero + "About this program" section
- New component `src/components/program-hero.tsx`.
- Replace the thin subtitle on `src/app/page.tsx` with: program mission (1 paragraph), who it serves, key partners, link to funder/donor logos.
- Content lives in `src/content/program.ts` (TypeScript constants) — easy to edit, no CMS needed yet.

### 1.4 Expose `reach` in the admin form
- File: `src/app/admin/activities/_components/activity-form.tsx`.
- Add `reach` input alongside `total_count`. Update the zod schema and the Server Action in `src/app/admin/activities/actions.ts`. Column already exists.

### 1.5 Filters beyond year
- Sub-project filter, location filter, date range — driven by URL params alongside `?year=`.
- New component `src/components/filter-bar.tsx`; update `getRecentActivities()` in `queries.ts` to accept the filter object.

### 1.6 Accessibility & SEO pass
- Add semantic landmarks (`<main>`, `<section>`, `<nav>`), `aria-label` on icon-only controls, proper heading hierarchy.
- `src/app/layout.tsx`: richer `metadata` (OpenGraph image, Twitter card, canonical URL). Use Next.js OG image generation at `src/app/opengraph-image.tsx` showing the latest KPI snapshot.

### 1.7 Activity detail page (current data only)
- New route: `src/app/activities/[id]/page.tsx`. Public, `revalidate = 60`.
- Shows: classification breadcrumb (sub-project → category → sub-category), date, location, gender split, reach, full notes, Discourse link.
- Foundation for the richer page in Phase 2 — same route, more fields later.

**Phase 1 acceptance**
- Zero-value KPIs never render.
- YoY arrow shows on every KPI when prior-year data exists.
- Admin can save `reach` from the form and see it reflected on the public dashboard.
- `/activities/[id]` reachable from each row of the activity feed.
- Lighthouse a11y score ≥ 95 on the home page.

---

## Phase 2 — Detail Pages & Schema Enrichment (~2–3 weeks)

Goal: turn each university, hub, sub-project, and activity into a shareable page funders can deep-link to. This is the bulk of the funder-storytelling work.

### 2.1 Schema migrations

Narrative fields are stored as **Tiptap JSON (`jsonb`)**, not plain text. Plain-text fields keep `text`.

**`supabase/migrations/0006_location_enrichment.sql`**
```sql
alter table locations
  add column slug text unique,
  add column description jsonb,         -- Tiptap JSON
  add column logo_url text,
  add column website_url text,
  add column lat numeric(9,6),
  add column lng numeric(9,6),
  add column partner_type text,         -- e.g. 'academic', 'community-hub', 'gov'
  add column first_active_date date;

create index locations_slug_idx on locations(slug);
```

**`supabase/migrations/0007_activity_enrichment.sql`**
```sql
alter table activities
  add column outcomes jsonb,            -- Tiptap JSON: what changed because of this activity
  add column highlights text,           -- short pull-quote, plain text (1–2 sentences)
  add column media_urls text[] default '{}',
  add column partner_orgs text[] default '{}';
```

**`supabase/migrations/0008_sub_project_enrichment.sql`**
```sql
alter table sub_projects
  add column slug text unique,
  add column description jsonb,         -- Tiptap JSON
  add column hero_image_url text,
  add column funder_name text,
  add column funder_logo_url text;

create index sub_projects_slug_idx on sub_projects(slug);
```

Backfill slugs in a `do $$ ... $$` block at the end of each migration.

### 2.2 Supabase Storage
- Bucket `dpg-media`, **public read**, **authenticated write** via Server Action.
- Storage helper `src/lib/supabase/storage.ts` — `uploadActivityMedia(file)`, `uploadLocationLogo(file)`. Returns public URL.

### 2.3 Rich-text editor (Tiptap)
- Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/html` (used server-side), and any extensions we need (`@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-image` if inline images make sense).
- New client component `src/components/editor/rich-text-editor.tsx`:
  - Wraps `useEditor({ extensions: [StarterKit, Link, Placeholder, …] })`.
  - Renders a small toolbar (bold, italic, H2/H3, bullet list, ordered list, link, quote, undo).
  - Controlled via `value: JSONContent | null` + `onChange(value: JSONContent)` so it slots into `react-hook-form` as a custom field.
- New server-only helper `src/lib/editor/render.ts`:
  - `renderRichText(json: JSONContent | null): string` using `@tiptap/html` `generateHTML()` with the same extension list as the editor.
  - Returns `''` for null / empty docs so detail pages can branch cleanly.
- New display component `src/components/editor/rich-text.tsx` — renders the HTML output inside a `prose` container (Tailwind typography classes, scoped so it inherits our font stack).
- **Why JSON not HTML:** lossless round-tripping; no sanitization-at-write risk; we control rendering by re-using our extension set, so the output HTML can never contain anything the editor didn't produce.

### 2.4 Admin form upgrades
- `activity-form.tsx`: add `outcomes` (**Tiptap rich-text**), `highlights` (plain text, single-line), `partner_orgs` (chip input), `media_urls` (multi-file upload with preview + drag-reorder).
- New route `src/app/admin/locations/[id]/page.tsx`: edit logo / **rich-text description** / website / coordinates. Today locations are only created inline — they deserve their own edit screen.
- New route `src/app/admin/sub-projects/[id]/page.tsx`: edit **rich-text description** / hero / funder.

### 2.5 Location detail page
- New route: `src/app/locations/[slug]/page.tsx`. Public, `revalidate = 60`.
- Layout:
  - Hero: logo + name + partner type badge + **rich-text description** (rendered via `<RichText json={location.description} />`) + website link.
  - KPI strip (location-scoped): participants, female %, activities, reach, distinct sub-projects.
  - Monthly trend chart (location-scoped).
  - Sub-project mix donut.
  - Recent activities list (links to `/activities/[id]`).
  - Photo gallery (collated from activities at this location).
- New RPC: `location_summary(p_slug text, p_year int)` — wraps `dashboard_summary` logic filtered by location.
- Update `locations-grid.tsx` to make cards clickable.

### 2.6 Sub-project detail page
- New route: `src/app/programs/[slug]/page.tsx`. Same shape as location page, scoped to sub-project, **rich-text description** in hero.

### 2.7 Activity detail upgrade
- Extend `src/app/activities/[id]/page.tsx` (built in 1.7) with: **rich-text outcomes section**, highlights pull-quote, photo gallery, partner chips. Renders gracefully when these are empty (the `renderRichText` helper returns `''` for empty docs, so we conditionally render the section).

### 2.8 Per-page OG images
- `src/app/locations/[slug]/opengraph-image.tsx` and same for `/programs/[slug]`, `/activities/[id]`. Shareable links matter when funders pass URLs around.

**Phase 2 acceptance**
- Every location card on the home page links to a detail page.
- Detail pages have logo + rich-text description for at least the 5 most-active locations (initial content pass).
- Admin can author outcomes/descriptions in the Tiptap editor with bold, headings, lists, and links; output renders identically on the public page (round-trip test: edit → save → reload → re-edit shows no formatting loss).
- New activities can be saved with photos and outcomes; both render on the detail page.
- Each `/locations/[slug]` and `/programs/[slug]` produces a unique OG image when shared.

---

## Phase 3 — Map, Comparisons & Reporting (~1–2 weeks)

Goal: the analytical layer funders evaluate proposals against — geography, growth, partners, exportable reports.

### 3.1 Geographic map
- New route: `src/app/map/page.tsx` (linked from header).
- `react-leaflet` + OpenStreetMap; markers from `locations.lat/lng` (added in 2.1), sized by `participants` for the active year, color-coded by `partner_type`.
- Marker popup links to `/locations/[slug]`.

### 3.2 Partners directory
- New route: `src/app/partners/page.tsx`. Aggregates distinct values from `activities.partner_orgs`, counts activities + participants per partner.
- Each partner becomes a filterable lens on the dashboard.

### 3.3 Year-over-year report
- New route: `src/app/report/[year]/page.tsx`. Printable layout — side-by-side current/prior totals, growth %, top movers (sub-projects and locations with biggest YoY change), narrative blocks pulled from `sub_projects.description`.
- "Download PDF" via browser print stylesheet (no server-side PDF rendering needed yet).

### 3.4 Demographics (lightweight)
- `supabase/migrations/0009_activity_demographics.sql`: optional `age_band` text[] and `roles` text[] on `activities` (e.g., "student", "educator").
- Admin form: chip pickers seeded from a `demographics_taxonomy` lookup table (keeps tag set controlled).
- Surface as a small breakdown card on activity + location detail pages.

### 3.5 Hardening
- Rate-limit admin Server Actions (Vercel BotID or a simple Supabase-backed limiter).
- Move dashboard reads to Next 16 **Cache Components** with `cacheTag('dashboard')` invalidated from Server Actions instead of `revalidatePath`. Faster TTFB and tag-scoped invalidation.
- Sentry or Vercel Observability for error/perf tracking.

**Phase 3 acceptance**
- `/map` shows every location with non-null coords; clicking a marker navigates to its detail page.
- `/report/2026` (and prior years) prints cleanly on one or two A4 pages.
- Partners directory shows every partner referenced in any activity.

---

## Cross-cutting concerns

- **Branch strategy.** `taks/reviews` is currently empty and at `main`. Use feature branches per phase: `feat/phase-1-polish`, `feat/phase-2-detail-pages`, `feat/phase-3-map-report`.
- **No new test runner introduced** unless requested — but every Server Action change should be smoke-tested via the admin UI before merging.
- **Funder-readiness checklist** (maintain below): hero narrative, named funders, photos on top activities, every active location has a detail page, OG images, map, YoY report.

---

## Critical files referenced

| File | Used in phase |
|---|---|
| `src/app/page.tsx` | 1.1, 1.2, 1.3, 1.5 |
| `src/components/kpi-card.tsx` | 1.1, 1.2 |
| `src/components/locations-grid.tsx` | 2.5 (make cards link) |
| `src/components/activity-feed.tsx` | 1.7 (link rows to detail) |
| `src/app/admin/activities/_components/activity-form.tsx` | 1.4, 2.4 |
| `src/app/admin/activities/actions.ts` | 1.4, 2.4 |
| `src/components/editor/rich-text-editor.tsx` (new) | 2.3 (used by every admin form thereafter) |
| `src/components/editor/rich-text.tsx` (new) | 2.3 (used by every detail page thereafter) |
| `src/lib/editor/render.ts` (new) | 2.3 (server-side Tiptap JSON → HTML) |
| `src/lib/supabase/queries.ts` | every phase (single data-access layer) |
| `supabase/migrations/000{6,7,8,9}*.sql` | 2.1, 3.4 |
| `proxy.ts` | leave alone unless we gate new admin routes |

---

## Verification

End-to-end checks per phase, run locally with `npm run dev`:

**Phase 1**
- Create an activity with `reach = 0`, confirm the Reach KPI card hides on the home page.
- Toggle a year that has no prior-year data — confirm YoY arrow is absent (not "▲ NaN%").
- Run Lighthouse: a11y ≥ 95, SEO ≥ 95.

**Phase 2**
- Apply migrations against a local Supabase or staging project.
- Through the admin form, edit a location: upload a logo, add description, save. Refresh `/locations/<slug>` and confirm hero renders.
- Create an activity with two photos and an `outcomes` paragraph. Visit `/activities/[id]` and confirm gallery + outcomes show.
- Share `/locations/fourah-bay-college` to Slack/LinkedIn — confirm a custom OG image renders.

**Phase 3**
- Backfill `lat/lng` for at least 3 locations. Open `/map` — confirm markers, click-through to detail.
- Open `/report/2026` and `Cmd+P` — confirm printable layout.

---

## Out of scope (call out so it isn't missed)

- Multi-tenant or multi-program support (one DPG program for now).
- A CMS-style WYSIWYG for narrative copy — content lives in TS files / DB text fields.
- Video upload (photos only; embed YouTube/Vimeo URLs via `media_urls` if needed).
- Public submission of activities — admins only.
- Internationalization (English-only for now).

---

## Funder-readiness checklist

Track here as work lands:

- [ ] Hero narrative copy approved and shipped
- [ ] Named funders + logos rendered on home page
- [ ] Photos uploaded for top 10 most-active activities
- [ ] Every location with ≥1 activity has its own `/locations/[slug]` page
- [ ] Every sub-project has a `/programs/[slug]` page with description
- [ ] OG images render for home, location, sub-project, and activity pages
- [ ] `/map` populated with coordinates for every active location
- [ ] `/report/<year>` reviewed and prints cleanly to one A4
