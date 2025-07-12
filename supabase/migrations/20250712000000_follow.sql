-- 20250712000000_follow.sql
-- Migration: Introduce unified Follow table supporting USER_ALL and USER_TAG channels

-----------------------------
-- FOLLOW TABLE
-----------------------------
create table public."Follow" (
  follower_user_id uuid references public."User"(user_id) on delete cascade,
  channel_type text check (channel_type in ('USER_ALL','USER_TAG')) not null,
  channel_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, channel_type, channel_id)
);

-- Indexes to speed up feed queries
create index idx_follow_follower on public."Follow"(follower_user_id);
create index idx_follow_channel on public."Follow"(channel_type, channel_id);

-----------------------------
-- ROW LEVEL SECURITY
-----------------------------
alter table public."Follow" enable row level security;

create policy "User manages own follows" on public."Follow"
  using (follower_user_id = auth.uid())
  with check (follower_user_id = auth.uid()); 