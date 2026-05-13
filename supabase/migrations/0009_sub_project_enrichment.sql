-- Phase 2 — Sub-project enrichment.
-- Adds narrative description (Tiptap JSON), hero image, and funder identity.
-- Slug already exists from 0001, so this migration only adds the four content columns.
-- Apply after 0008.

alter table public.sub_projects
  add column if not exists description      jsonb,
  add column if not exists hero_image_url   text,
  add column if not exists funder_name      text,
  add column if not exists funder_logo_url  text;
