-- Structured content blocks for projects: FAQ, testimonial, stats, gallery,
-- video. Stored as an ordered JSONB array rather than more columns, because
-- the set of block types will keep growing and each one has its own shape.
-- The rich-text `content` field stays as the narrative body; blocks are the
-- designed sections that sit alongside it.
alter table public.projects
  add column blocks jsonb not null default '[]'::jsonb;

-- Guard against anything that is not a JSON array landing in here.
alter table public.projects
  add constraint projects_blocks_is_array
  check (jsonb_typeof(blocks) = 'array');
