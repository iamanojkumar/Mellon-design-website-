-- Admin v2: folders, publish workflow, SEO/structured-data fields, and raw
-- head/body injection for projects. Same access model as the rest of the
-- admin data: RLS on, no grants to anon/authenticated, reached only by the
-- server-only service-role key.

create table public.project_folders (
  id uuid primary key default gen_random_uuid(),
  locale text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (locale, name)
);

alter table public.project_folders enable row level security;

revoke all on public.project_folders from anon, authenticated;

alter table public.projects
  -- Deleting a folder unfiles its projects rather than destroying them.
  add column folder_id uuid references public.project_folders(id) on delete set null,
  add column status text not null default 'draft'
    check (status in ('draft', 'published', 'unpublished')),
  -- Stamped the first time a project reaches 'published'; feeds datePublished
  -- in structured data, and stays put if it is later unpublished.
  add column published_at timestamptz,
  add column focus_keyword text,
  add column canonical_url text,
  add column og_title text,
  add column og_description text,
  add column og_image text,
  add column schema_type text not null default 'CreativeWork'
    check (schema_type in ('CreativeWork', 'Article', 'BlogPosting')),
  -- Hand-written JSON-LD; when non-empty it replaces the generated graph.
  add column json_ld_override text,
  add column custom_head text,
  add column custom_body text;

create index projects_folder_idx on public.projects (folder_id);

create index projects_locale_status_idx on public.projects (locale, status, created_at desc);
