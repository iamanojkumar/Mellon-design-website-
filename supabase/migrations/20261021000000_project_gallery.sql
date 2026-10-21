-- Image-led projects (graphic design, motion and interaction design).
--
-- `rich_text` off means the project is shown as images only: the detail page
-- drops the written case study and blocks, and leads with a horizontal,
-- marquee-style row of its images. On (the default) keeps the case-study page,
-- so every existing row is unchanged.
--
-- `gallery` holds the images after the hero image, in order, as
-- [{ "src", "alt", "width", "height" }]. The hero image stays the cover (the
-- first image everywhere, and the OG/JSON-LD image), so nothing that reads
-- hero_image needs to know about the gallery.
alter table public.projects
  add column rich_text boolean not null default true,
  add column gallery jsonb not null default '[]'::jsonb;
