-- Contact form enquiries. Written only by the website's server action using
-- the service-role key; RLS is on with no policies, so the public (anon /
-- authenticated) API can neither read nor write this table.
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null,
  name text not null,
  email text not null,
  company text,
  budget text,
  message text not null,
  status text not null default 'new'
);

create index contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;

revoke all on public.contact_submissions from anon, authenticated;
