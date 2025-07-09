-- Enable RLS on tag tables
alter table public."CanonicalTag" enable row level security;
alter table public."UserTag" enable row level security;

-- CanonicalTag policies
-- Anyone can read canonical tags
create policy "Public read canonical tags" on public."CanonicalTag"
  for select using (true);

-- Any authenticated user can create canonical tags
create policy "Authenticated users can create canonical tags" on public."CanonicalTag"
  for insert with check (auth.uid() is not null);

-- UserTag policies (already have basic ones, adding more)
-- View any user's tags (public)
create policy "Public read user tags" on public."UserTag"
  for select using (true);

-- Users can create their own tags
create policy "Users can create own tags" on public."UserTag"
  for insert with check (
    auth.uid() = user_id
  );

-- Users can update their own tags (for credibility scores, etc)
create policy "Users can update own tags" on public."UserTag"
  for update using (
    auth.uid() = user_id
  );

-- Users can delete their own tags  
create policy "Users can delete own tags" on public."UserTag"
  for delete using (
    auth.uid() = user_id
  ); 