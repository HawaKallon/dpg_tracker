-- Phase 2 — Activity enrichment.
-- Adds outcomes (Tiptap JSON), highlights pull-quote, photo gallery, and partner org chips
-- to the activities fact table. All fields nullable so existing rows degrade gracefully.
-- Apply after 0007.

alter table public.activities
  add column if not exists outcomes     jsonb,
  add column if not exists highlights   text,
  add column if not exists media_urls   text[] not null default '{}',
  add column if not exists partner_orgs text[] not null default '{}';
