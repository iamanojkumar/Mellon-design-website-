-- Portfolio/case-study projects, authored through the password-protected
-- /admin tool. Each row belongs to exactly one locale (no fallback/inheritance
-- like the git-JSON content model) so a locale's project list is independent.
-- Written only by admin Server Actions using the service-role key; RLS is on
-- with no policies, so the public (anon / authenticated) API can neither read
-- nor write this table directly.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  locale text not null,
  slug text not null,
  title text not null,
  summary text,
  category text not null,
  service text not null,
  hero_image text,
  content text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);

create index projects_locale_idx
  on public.projects (locale, created_at desc);

alter table public.projects enable row level security;

revoke all on public.projects from anon, authenticated;

-- Public bucket for hero images / rich-content media. Uploads only ever
-- happen server-side (service-role key via a Server Action); public read
-- access lets project pages render images directly.
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;
