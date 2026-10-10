-- Blog posts, authored through /admin/blog. Same shape and rules as projects:
-- one locale per row (no fallback), written only by admin Server Actions with
-- the service-role key, RLS on with no policies so the public API can neither
-- read nor write the table. Images reuse the existing 'project-media' bucket.
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  locale text not null,
  slug text not null,
  title text not null,
  summary text,
  hero_image text,
  hero_image_alt text,
  hero_image_width integer,
  hero_image_height integer,
  content text not null default '',
  featured boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'unpublished')),
  published_at timestamptz,
  -- Every slug this post has answered to, so renamed URLs can 301.
  previous_slugs text[] not null default '{}',
  meta_title text,
  meta_description text,
  focus_keyword text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);

create index blog_posts_locale_idx
  on public.blog_posts (locale, created_at desc);

create index blog_posts_previous_slugs_idx
  on public.blog_posts using gin (previous_slugs);

alter table public.blog_posts enable row level security;

revoke all on public.blog_posts from anon, authenticated;

-- Stamp published_at the first time a post reaches 'published'; unpublishing
-- keeps the original date.
create or replace function public.stamp_blog_post_published_at()
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

create trigger blog_posts_stamp_published_at
  before insert or update on public.blog_posts
  for each row
  execute function public.stamp_blog_post_published_at();

create or replace function public.track_blog_post_slug_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug then
    new.previous_slugs := array(
      select distinct entry
      from unnest(old.previous_slugs || old.slug) as entry
      where entry is not null and entry <> new.slug
    );
  end if;
  return new;
end;
$$;

create trigger blog_posts_track_slug_history
  before update on public.blog_posts
  for each row
  execute function public.track_blog_post_slug_history();
