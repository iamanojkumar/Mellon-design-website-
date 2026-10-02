-- URLs that Search Console reports as 404, imported from its CSV export in
-- /admin/indexing, plus what the owner decided to do about each one.
-- status: pending  = imported, no decision yet (still a plain 404)
--         gone     = answer 410 Gone (middleware.ts reads these)
--         redirect = answer 301 to redirect_to
--         ignored  = leave as a 404, hide from the to-do list
-- A path ending in /* is a prefix rule. Written only by admin Server Actions
-- (and read by middleware) with the service-role key; RLS on, no policies.
create table public.url_rules (
  id uuid primary key default gen_random_uuid(),
  host text not null,
  path text not null,
  original_url text not null,
  last_crawled date,
  status text not null default 'pending'
    check (status in ('pending', 'gone', 'redirect', 'ignored')),
  redirect_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (host, path)
);

create index url_rules_status_idx on public.url_rules (status);

alter table public.url_rules enable row level security;

revoke all on public.url_rules from anon, authenticated;
