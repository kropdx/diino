-- Create a profiles view that maps to the User table for compatibility

-- Create a view that maps profiles to User table
create or replace view public.profiles as
select 
  auth_id as id,
  user_id,
  email,
  username,
  display_name,
  bio,
  url as website_url,
  profile_image_source_url,
  profile_image_optimized_url,
  onboarded,
  created_at,
  updated_at
from public."User";

-- Grant appropriate permissions on the view
grant select on public.profiles to authenticated;
grant select on public.profiles to anon;

-- Create an INSTEAD OF trigger to handle inserts to the view
create or replace function public.handle_profiles_insert()
returns trigger as $$
begin
  insert into public."User" (
    auth_id,
    email,
    username,
    display_name,
    bio,
    url,
    onboarded
  ) values (
    new.id,
    coalesce(new.email, (select email from auth.users where id = new.id)),
    new.username,
    new.display_name,
    new.bio,
    new.website_url,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_insert_trigger
  instead of insert on public.profiles
  for each row
  execute function public.handle_profiles_insert();

-- Create an INSTEAD OF trigger to handle updates to the view
create or replace function public.handle_profiles_update()
returns trigger as $$
begin
  update public."User"
  set
    username = new.username,
    display_name = new.display_name,
    bio = new.bio,
    url = new.website_url
  where auth_id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_update_trigger
  instead of update on public.profiles
  for each row
  execute function public.handle_profiles_update(); 