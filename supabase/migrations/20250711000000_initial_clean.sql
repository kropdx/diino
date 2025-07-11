-- 20250711000000_initial_clean.sql
-- Complete clean schema for Diino (no auth_id column)
-- Run on an empty database linked to project zinencmbqximkrqfkjol

-----------------------------
-- EXTENSIONS & ENUMS
-----------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()
create extension if not exists "http";      -- used by URL metadata fetcher

create type story_type as enum ('TEXT','URL','REPOST');
create type report_status as enum ('PENDING','REVIEWED','RESOLVED');

-----------------------------
-- CORE TABLES
-----------------------------
-- Users table – id matches auth.users.id
create table public."User" (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text unique check (char_length(username) <= 50),
  display_name text,
  bio text,
  url text,
  profile_image_source_url text,
  profile_image_optimized_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Canonical tags
create table public."CanonicalTag" (
  tag_id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

-- User-specific tag ownership
create table public."UserTag" (
  user_tag_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."User"(user_id) on delete cascade,
  tag_id uuid not null references public."CanonicalTag"(tag_id) on delete cascade,
  credibility_score bigint not null default 0,
  follower_count   bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tag_id)
);

-- Stories
create table public."Story" (
  story_id uuid primary key default gen_random_uuid(),
  short_id text unique not null,
  author_id uuid not null references public."User"(user_id) on delete cascade,
  user_tag_id uuid not null references public."UserTag"(user_tag_id) on delete cascade,
  story_type story_type not null,
  content text,
  url text,
  title text,
  favicon text,
  favicon_blob_url text,
  subtag text,
  upvotes bigint not null default 0,
  original_story_id uuid references public."Story"(story_id) on delete set null,
  commentary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_story_author on public."Story"(author_id);
create index idx_story_tag on public."Story"(user_tag_id);

-- Comments
create table public."Comment" (
  comment_id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public."Story"(story_id) on delete cascade,
  author_id uuid not null references public."User"(user_id) on delete cascade,
  content text not null,
  upvotes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_comment_story on public."Comment"(story_id);

-- Interaction tables (composite PK)
create table public."StoryUpvote" (
  user_id uuid references public."User"(user_id) on delete cascade,
  story_id uuid references public."Story"(story_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create table public."CommentUpvote" (
  user_id uuid references public."User"(user_id) on delete cascade,
  comment_id uuid references public."Comment"(comment_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create table public."Bookmark" (
  user_id uuid references public."User"(user_id) on delete cascade,
  story_id uuid references public."Story"(story_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create table public."UserTagFollow" (
  follower_user_id uuid references public."User"(user_id) on delete cascade,
  followed_user_tag_id uuid references public."UserTag"(user_tag_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, followed_user_tag_id)
);

-- Reports
create table public."StoryReport" (
  report_id uuid primary key default gen_random_uuid(),
  story_id uuid references public."Story"(story_id) on delete cascade,
  reporting_user_id uuid references public."User"(user_id) on delete cascade,
  reason text not null,
  status report_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin users
create table public."AdminUser" (
  admin_id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public."User"(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

-----------------------------
-- CHAT SUBSYSTEM (abbrev.)
-----------------------------
create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table public.chat_members (
  room_id uuid references public.chat_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table public.chat_messages (
  id bigserial primary key,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) <= 2000),
  metadata jsonb not null default '{}'::jsonb,
  client_id uuid not null,
  created_at timestamptz default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index chat_messages_room_created_idx on public.chat_messages(room_id, created_at);

-----------------------------
-- FUNCTIONS & TRIGGERS
-----------------------------
-- updated_at helper
create or replace function public.set_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

-- attach to tables with updated_at column
create trigger set_timestamp_user before update on public."User"
  for each row execute function public.set_timestamp();
create trigger set_timestamp_usertag before update on public."UserTag"
  for each row execute function public.set_timestamp();
create trigger set_timestamp_story before update on public."Story"
  for each row execute function public.set_timestamp();
create trigger set_timestamp_comment before update on public."Comment"
  for each row execute function public.set_timestamp();

-- Insert user row when new auth user signs up (for extra columns)
create or replace function public.handle_new_user()
returns trigger security definer language plpgsql as $$
begin
  insert into public."User"(user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set username on chat message from profiles view
create or replace function public.set_message_username()
returns trigger language plpgsql as $$
begin
  select username into new.username from public.profiles where id = new.sender_id;
  return new;
end;$$;
create trigger chat_messages_username before insert on public.chat_messages
  for each row execute procedure public.set_message_username();

-----------------------------
-- VIEW
-----------------------------
create or replace view public.profiles as
select 
  u.user_id as id,
  u.username,
  u.display_name,
  u.bio,
  u.url as website_url,
  u.profile_image_source_url,
  u.profile_image_optimized_url,
  u.created_at,
  u.updated_at
from public."User" u;

-----------------------------
-- RLS POLICIES
-----------------------------
-- Enable RLS
alter table public."User" enable row level security;
create policy "Users can view own profile" on public."User"
  for select using (auth.uid() = user_id);

alter table public."CanonicalTag" enable row level security;
alter table public."UserTag" enable row level security;
create policy "Users manage own tags" on public."UserTag"
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public."Story" enable row level security;
create policy "Public read stories" on public."Story" for select using (true);
create policy "Insert own stories" on public."Story"
  for insert with check (author_id = auth.uid());

alter table public."Comment" enable row level security;
create policy "Public read comments" on public."Comment" for select using (true);
create policy "Write own comment" on public."Comment"
  for all using (author_id = auth.uid())
  with check (author_id = auth.uid());

alter table public."Bookmark" enable row level security;
create policy "User manages own bookmarks" on public."Bookmark"
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public."StoryUpvote" enable row level security;
create policy "User manages own story upvotes" on public."StoryUpvote"
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public."CommentUpvote" enable row level security;
create policy "User manages own comment upvotes" on public."CommentUpvote"
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public."UserTagFollow" enable row level security;
create policy "User manages own follows" on public."UserTagFollow"
  for all using (follower_user_id = auth.uid()) with check (follower_user_id = auth.uid());

-----------------------------
-- END OF MIGRATION
----------------------------- 