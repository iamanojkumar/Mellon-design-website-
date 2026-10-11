-- Editorial control over "Related work" (service/industry/landing pages) and
-- "Related articles" (blog posts). Same rules as the other admin tables:
-- written only by admin Server Actions with the service-role key, RLS on with
-- no policies so the public API can neither read nor write them.

-- Extra services a project is relevant to, beyond its primary `service`. A
-- social campaign that includes graphic design lists graphic-design here so it
-- also qualifies for that service page, deliberately rather than as filler.
alter table public.projects
  add column also_services text[] not null default '{}';

-- Per-article picks: `related_pinned` shows first, in order; `related_hidden`
-- removes an automatic (same-category) match. Both hold blog_posts ids.
alter table public.blog_posts
  add column related_pinned uuid[] not null default '{}',
  add column related_hidden uuid[] not null default '{}';

-- Per-page picks for a service or industry page. Landing pages read the row of
-- the service they belong to. `pinned`/`hidden` hold projects ids.
create table public.related_work (
  locale text not null,
  kind text not null check (kind in ('service', 'industry')),
  slug text not null,
  pinned uuid[] not null default '{}',
  hidden uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (locale, kind, slug)
);

alter table public.related_work enable row level security;

revoke all on public.related_work from anon, authenticated;
