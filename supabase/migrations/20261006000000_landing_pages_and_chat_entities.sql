-- Landing pages created in /admin/landing-editor. They render with the same
-- ServiceLanding layout as the code-defined pages in app/[locale]/(landing-pages);
-- only the copy differs. One row = one page (one slug). `locale` is the language
-- and market the copy is written for; `locales` lists every market the page is
-- served in (same-language fallbacks of that copy, plus `locale` itself).
-- Written only by admin Server Actions with the service-role key; RLS on, no policies.
create table public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  locale text not null,
  locales text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'unpublished')),
  -- false = live but noindex and left out of the sitemap.
  indexable boolean not null default true,
  -- Service slug whose projects the "related work" section ranks first.
  service text,
  -- Search phrase, demand verdict and evidence (the demand rule's record).
  demand_note text,
  -- The ServiceLandingCopy object, validated on write and again on render.
  copy jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index landing_pages_status_idx on public.landing_pages (status, updated_at desc);

alter table public.landing_pages enable row level security;
revoke all on public.landing_pages from anon, authenticated;

create or replace function public.stamp_landing_page_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger landing_pages_stamp_published_at
  before insert or update on public.landing_pages
  for each row
  execute function public.stamp_landing_page_published_at();

-- Chats now belong to one page (or post, or project), so each page keeps its own
-- history. `entity_id` is null for a chat started before the page was first saved;
-- the editor attaches it on first save.
alter table public.admin_chats add column entity_id uuid;

create index admin_chats_entity_idx on public.admin_chats (scope, entity_id, updated_at desc);
