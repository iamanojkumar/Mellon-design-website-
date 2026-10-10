-- Optional pastel behind the hero (nav, overline, heading, subtext, image).
-- Null means transparent, the default. Stored as #rrggbb; the app validates it
-- on write and again on render.
alter table public.projects
  add column hero_bg text check (hero_bg is null or hero_bg ~ '^#[0-9a-fA-F]{6}$');

alter table public.blog_posts
  add column hero_bg text check (hero_bg is null or hero_bg ~ '^#[0-9a-fA-F]{6}$'),
  -- Free-text label chosen per locale in the admin; the slug is derived.
  add column category text;

create index blog_posts_category_idx
  on public.blog_posts (locale, category);
