-- SEO round three: meta title/description separate from the on-page title and
-- summary, hero image alt + intrinsic size, a noindex switch, and slug history
-- so renaming a published project does not strand its old URL.

alter table public.projects
  -- Optional overrides. Empty means "fall back to title / summary", which is
  -- how the OG fields already behave.
  add column meta_title text,
  add column meta_description text,
  add column hero_image_alt text,
  -- Intrinsic dimensions, detected on upload/paste. Feed width/height on the
  -- public <img> to avoid layout shift, and ImageObject in structured data.
  add column hero_image_width integer,
  add column hero_image_height integer,
  -- Published but deliberately kept out of the index (confidential or thin work).
  add column noindex boolean not null default false,
  -- Every slug this project has previously answered to, so those URLs can
  -- redirect instead of 404ing. Maintained by a trigger, never by the app.
  add column previous_slugs text[] not null default '{}';

create index projects_previous_slugs_idx
  on public.projects using gin (previous_slugs);

create or replace function public.track_project_slug_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug then
    -- Keep the old slug, drop any copy of the slug we just moved to: renaming
    -- a -> b -> a must not leave 'a' redirecting to itself.
    new.previous_slugs := array(
      select distinct entry
      from unnest(old.previous_slugs || old.slug) as entry
      where entry is not null and entry <> new.slug
    );
  end if;
  return new;
end;
$$;

create trigger projects_track_slug_history
  before update on public.projects
  for each row
  execute function public.track_project_slug_history();
