-- Initial lookup data for DPG Tracker
-- Run after 0001_init.sql

insert into public.sub_projects (name, slug, display_order) values
  ('Community of Practice', 'cop',           1),
  ('Academia',              'academia',      2),
  ('Policy',                'policy',        3),
  ('Pipeline',              'pipeline',      4),
  ('Bounty Platform',       'bounty',        5),
  ('Learn2Earn',            'learn2earn',    6)
on conflict (slug) do nothing;

insert into public.locations (name, type) values
  ('Eastern Technical University',          'university'),
  ('Ernest Bai Koroma University',          'university'),
  ('IPAM',                                  'university'),
  ('Limkokwing University',                 'university'),
  ('Fourah Bay College',                    'university'),
  ('Fourah Bay College Digital Learning Hub','hub'),
  ('Central University',                    'university'),
  ('Njala University - Bo Campus',          'university'),
  ('Orange Digital Center',                 'hub'),
  ('Online',                                'online')
on conflict (name) do nothing;

with sp as (select id, slug from public.sub_projects)
insert into public.categories (sub_project_id, name)
select sp.id, c.name from sp
join (values
  ('cop',        'DPG Meetup Hub Training'),
  ('cop',        'Discourse Online Community'),
  ('cop',        'WhatsApp DPG Community'),
  ('cop',        'DPG CoP General Meetup'),
  ('academia',   'UNU Curriculum'),
  ('academia',   'DPG Clubs/CoP in Universities'),
  ('policy',     'Open Source Policy')
) as c(slug, name) on c.slug = sp.slug
on conflict (sub_project_id, name) do nothing;
