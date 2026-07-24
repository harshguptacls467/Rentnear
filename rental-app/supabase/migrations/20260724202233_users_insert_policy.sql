-- -------------------------------------------------
-- RLS: Allow an authenticated user to insert their own public profile
-- -------------------------------------------------
create policy "Authenticated users can insert their own profile (fallback)"
  on public.users
  for insert
  with check (auth.uid() = id);
