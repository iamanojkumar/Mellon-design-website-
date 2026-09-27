-- Stamp published_at the first time a project reaches 'published'.
-- Done in the database rather than in lib/projects.ts so the invariant holds
-- for every write path (single save, AI bulk create, duplicate-to-locale)
-- without each one having to read the row back first. Unpublishing keeps the
-- original date, so structured data still reports when the piece first went live.
create or replace function public.stamp_project_published_at()
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

create trigger projects_stamp_published_at
  before insert or update on public.projects
  for each row
  execute function public.stamp_project_published_at();
