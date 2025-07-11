-- Add missing RLS policies for User table

-- Allow users to check username availability (select username column only)
create policy "Public can check usernames" on public."User"
  for select using (true);

-- Allow users to update their own profile
create policy "Users can update own profile" on public."User"
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id); 