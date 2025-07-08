-- Diino initial schema migration (Supabase) 2025-07-07

-- Enable required extensions
create extension if not exists "pgcrypto"; -- for gen_random_uuid()
create extension if not exists http;         -- for future edge trigger posts

-- Helper function to auto-update updated_at
create or replace function set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

/* ----------------------------------------------------------------------
   Core Tables
   --------------------------------------------------------------------*/

-- Users
create table if not exists public."User" (
  user_id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text unique,
  display_name text,
  bio text,
  url text,
  profile_image_source_url text,
  profile_image_optimized_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  auth_id uuid references auth.users(id) on delete set null,
  constraint username_length check (char_length(username) <= 50)
);
create trigger trg_user_set_timestamp
before update on public."User"
for each row execute procedure set_timestamp();

-- CanonicalTag
create table if not exists public."CanonicalTag" (
  tag_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- UserTag (user-owned channel)
create table if not exists public."UserTag" (
  user_tag_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."User"(user_id) on delete cascade,
  tag_id uuid not null references public."CanonicalTag"(tag_id) on delete cascade,
  credibility_score bigint not null default 0,
  follower_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tag_id)
);
create trigger trg_usertag_set_timestamp
before update on public."UserTag"
for each row execute procedure set_timestamp();

-- Story
create type public.story_type as enum ('TEXT','URL','REPOST');
create table if not exists public."Story" (
  story_id uuid primary key default gen_random_uuid(),
  short_id text not null unique,
  author_id uuid not null references public."User"(user_id) on delete cascade,
  user_tag_id uuid not null references public."UserTag"(user_tag_id) on delete cascade,
  story_type public.story_type not null,
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
create trigger trg_story_set_timestamp
before update on public."Story"
for each row execute procedure set_timestamp();

-- StoryUpvote
create table if not exists public."StoryUpvote" (
  user_id uuid references public."User"(user_id) on delete cascade,
  story_id uuid references public."Story"(story_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, story_id)
);

-- Bookmark
create table if not exists public."Bookmark" (
  user_id uuid references public."User"(user_id) on delete cascade,
  story_id uuid references public."Story"(story_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, story_id)
);

-- UserTagFollow
create table if not exists public."UserTagFollow" (
  follower_user_id uuid references public."User"(user_id) on delete cascade,
  followed_user_tag_id uuid references public."UserTag"(user_tag_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_user_id, followed_user_tag_id)
);

-- Comment
create table if not exists public."Comment" (
  comment_id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public."Story"(story_id) on delete cascade,
  author_id uuid not null references public."User"(user_id) on delete cascade,
  content text not null,
  upvotes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_comment_set_timestamp
before update on public."Comment"
for each row execute procedure set_timestamp();

-- CommentUpvote
create table if not exists public."CommentUpvote" (
  user_id uuid references public."User"(user_id) on delete cascade,
  comment_id uuid references public."Comment"(comment_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, comment_id)
);

-- StoryReport
create type public.report_status as enum ('PENDING','REVIEWED','RESOLVED');
create table if not exists public."StoryReport" (
  report_id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public."Story"(story_id) on delete cascade,
  reporting_user_id uuid not null references public."User"(user_id) on delete cascade,
  reason text,
  status public.report_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_report_set_timestamp
before update on public."StoryReport"
for each row execute procedure set_timestamp();

-- AdminUser
create table if not exists public."AdminUser" (
  admin_id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public."User"(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

/* ----------------------------------------------------------------------
   Row-Level Security Policies
   --------------------------------------------------------------------*/

alter table public."User" enable row level security;
create policy "Users can view their own data" on public."User"
  for select using (auth.uid() = user_id);

-- Stories are public read, owner write
alter table public."Story" enable row level security;
create policy "Read stories" on public."Story" for select using (true);
create policy "Insert own stories" on public."Story" for insert with check (auth.uid() = author_id);
create policy "Update own stories" on public."Story" for update using (auth.uid() = author_id);

-- Comments similar
alter table public."Comment" enable row level security;
create policy "Read comments" on public."Comment" for select using (true);
create policy "Insert own comments" on public."Comment" for insert with check (auth.uid() = author_id);
create policy "Update own comments" on public."Comment" for update using (auth.uid() = author_id);

-- Voting tables: allow authenticated inserts matching auth.uid()
alter table public."StoryUpvote" enable row level security;
create policy "Insert own upvote" on public."StoryUpvote" for insert with check (auth.uid() = user_id);

alter table public."Bookmark" enable row level security;
create policy "Insert own bookmark" on public."Bookmark" for insert with check (auth.uid() = user_id);

alter table public."CommentUpvote" enable row level security;
create policy "Insert own comment upvote" on public."CommentUpvote" for insert with check (auth.uid() = user_id);

alter table public."UserTag" enable row level security;
create policy "Read usertags" on public."UserTag" for select using (true);
create policy "Insert own usertag" on public."UserTag" for insert with check (auth.uid() = user_id);

alter table public."UserTagFollow" enable row level security;
create policy "Insert follow" on public."UserTagFollow" for insert with check (auth.uid() = follower_user_id);

/* ----------------------------------------------------------------------
   Indexes
   --------------------------------------------------------------------*/
create index if not exists idx_story_author on public."Story"(author_id);
create index if not exists idx_story_tag on public."Story"(user_tag_id);
create index if not exists idx_comment_story on public."Comment"(story_id); 