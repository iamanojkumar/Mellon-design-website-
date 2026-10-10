-- Saved AI assistant conversations for the admin tools. `scope` says which tool
-- a chat belongs to ('blog' today), so projects can reuse the table later.
-- Messages are the AI SDK's UIMessage[] stored as-is. Written only by admin
-- Server Actions with the service-role key; RLS on, no policies.
create table public.admin_chats (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  title text not null default 'New chat',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_chats_scope_idx
  on public.admin_chats (scope, updated_at desc);

alter table public.admin_chats enable row level security;

revoke all on public.admin_chats from anon, authenticated;
