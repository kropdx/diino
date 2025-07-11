-- Fix RLS policies for tag fetching and user lookups

-- Drop the overly restrictive User policy
drop policy if exists "Users can view their own data" on public."User";

-- Create better User policies
create policy "Users can view own profile by auth_id" on public."User"
  for select using (auth.uid() = auth_id);

create policy "Public can view user profiles" on public."User"
  for select using (true);

-- The CanonicalTag table already has RLS enabled in migration 3
-- Just need to ensure the policies from migration 3 are correct

-- Additional UserTag policies if needed
drop policy if exists "Insert own usertag" on public."UserTag";

create policy "Users can insert own tags" on public."UserTag"
  for insert with check (
    exists (
      select 1 from public."User"
      where user_id = public."UserTag".user_id
      and auth_id = auth.uid()
    )
  );

create policy "Users can update own tags" on public."UserTag"
  for update using (
    exists (
      select 1 from public."User"
      where user_id = public."UserTag".user_id
      and auth_id = auth.uid()
    )
  );

create policy "Users can delete own tags" on public."UserTag"
  for delete using (
    exists (
      select 1 from public."User"
      where user_id = public."UserTag".user_id
      and auth_id = auth.uid()
    )
  ); 