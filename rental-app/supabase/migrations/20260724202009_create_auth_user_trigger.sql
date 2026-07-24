-- -------------------------------------------------
-- Trigger: automatically create a public user row
-- -------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert a row into the public.users table whenever a new auth user appears
  insert into public.users (
    id,
    email,
    name,
    role,
    created_at,
    is_admin,
    kyc_status,
    kyc_verified
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'both')::public.user_role,
    now(),
    false,
    'unverified',
    false
  );

  return new;
end;
$$ language plpgsql security definer;

-- Drop the old trigger if it exists (safe‑guard)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
