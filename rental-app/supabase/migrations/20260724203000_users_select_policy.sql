-- -------------------------------------------------
-- Enable RLS on public.users and allow authenticated users to SELECT their own profile
-- -------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
