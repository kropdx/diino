-- Migration: chat core tables, RLS, retention job (90-day)
-- Depends on: initial_diino

-- 1. Tables -----------------------------------------------------------

create table if not exists chat_rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists chat_members (
  room_id uuid not null references chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role    text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists chat_messages (
  id         bigint generated always as identity primary key,
  room_id    uuid not null references chat_rooms(id) on delete cascade,
  sender_id  uuid not null references auth.users(id),
  content    text not null check (length(content) <= 2000),
  metadata   jsonb not null default '{}'::jsonb,
  client_id  uuid not null, -- for optimistic reconciliation
  created_at timestamptz not null default now(),
  edited_at  timestamptz,
  deleted_at timestamptz
);

create index if not exists chat_messages_room_created_idx on chat_messages(room_id, created_at desc);

-- 2. Row-Level Security ----------------------------------------------

alter table chat_rooms    enable row level security;
alter table chat_members  enable row level security;
alter table chat_messages enable row level security;

-- chat_rooms policies (read-only for all authenticated, insert by anyone for now)
create policy "chat_rooms_select" on chat_rooms
  for select using (auth.role() = 'authenticated');

create policy "chat_rooms_insert" on chat_rooms
  for insert with check (auth.role() = 'authenticated');

-- chat_members: user can see/insert their own membership rows
create policy "chat_members_select" on chat_members
  for select using (user_id = auth.uid());

create policy "chat_members_insert" on chat_members
  for insert with check (user_id = auth.uid());

-- chat_messages policies
create policy "chat_messages_select_room_member" on chat_messages
  for select using (exists (
    select 1 from chat_members
    where chat_members.room_id = chat_messages.room_id
      and chat_members.user_id = auth.uid()
  ));

create policy "chat_messages_insert_room_member" on chat_messages
  for insert with check (exists (
    select 1 from chat_members
    where chat_members.room_id = chat_messages.room_id
      and chat_members.user_id = auth.uid()
  ) and sender_id = auth.uid());

create policy "chat_messages_update_owner" on chat_messages
  for update using (sender_id = auth.uid());

-- 3. Retention job (requires pg_cron) --------------------------------

select
  cron.schedule(
    'clean_old_chat_messages',
    '0 3 * * *', -- daily 03:00 UTC
    $$delete from chat_messages where created_at < now() - interval '90 days'$$
  );

-- 4. Seed global room & join system user -----------------------------

-- create a deterministic UUID for the global room: 00000000-0000-0000-0000-000000000001
insert into chat_rooms (id, name)
  values ('00000000-0000-0000-0000-000000000001', 'global')
  on conflict do nothing; 