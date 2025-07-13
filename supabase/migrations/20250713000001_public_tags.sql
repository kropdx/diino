-- 20250713000001_public_tags.sql
-- Allow any authenticated user to read CanonicalTag and UserTag rows so profiles display correctly

-----------------------------
-- CanonicalTag: public select
-----------------------------
create policy "Public read canonical tags" on public."CanonicalTag"
  for select using (true);

-----------------------------
-- UserTag: public select
-----------------------------
create policy "Public read user tags" on public."UserTag"
  for select using (true); 