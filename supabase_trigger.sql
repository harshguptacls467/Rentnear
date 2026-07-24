-- =========================================================================
-- Supabase Trigger: Auto-sync Auth Users with Public Profiles Table
-- =========================================================================
--
-- INSTRUCTIONS:
-- 1. Copy this entire script.
-- 2. Go to your Supabase Dashboard -> SQL Editor -> New Query.
-- 3. Paste and click "Run".
--
-- This function automatically creates a record in your public "users" table
-- whenever a new user signs up in Supabase (auth.users). It prevents
-- foreign key violation crashes and resolves KYC registration issues.
-- =========================================================================

-- Create or update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    name, 
    email, 
    role, 
    kyc_status, 
    kyc_verified, 
    is_admin,
    avatar_url
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'name', 
      new.raw_user_meta_data->>'full_name', 
      split_part(new.email, '@', 1)
    ),
    new.email,
    'both',
    'unverified',
    false,
    COALESCE((new.email = 'harshguptacls467@gmail.com' OR new.email = 'harshguptcls467@gmail.com'), false),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that runs AFTER a new user is inserted in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
