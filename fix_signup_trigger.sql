-- =========================================================================
-- SQL Repair Script: Fix Database Error Saving New User on Signup
-- =========================================================================
-- Instructions:
-- 1. Copy this entire script.
-- 2. Go to your Supabase Dashboard -> SQL Editor -> New Query.
-- 3. Paste and click "Run".
-- =========================================================================

-- 1. Safely create user_role enum type if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('renter', 'owner', 'both');
    END IF;
END $$;

-- 2. Recreate handle_new_user function with safe type conversion and orphan cleanup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete any orphaned profile row with the same email but different id
  DELETE FROM public.users WHERE email = new.email AND id != new.id;

  INSERT INTO public.users (
    id, 
    name, 
    email, 
    role, 
    kyc_status, 
    kyc_verified, 
    is_admin,
    avatar_url,
    phone
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'name', 
      new.raw_user_meta_data->>'full_name', 
      split_part(new.email, '@', 1)
    ),
    new.email,
    -- Safe case validation to prevent invalid enum casts from crashing signup
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'renter' THEN 'renter'::public.user_role
      WHEN new.raw_user_meta_data->>'role' = 'owner' THEN 'owner'::public.user_role
      ELSE 'both'::public.user_role
    END,
    'unverified',
    false,
    COALESCE((new.email = 'harshguptacls467@gmail.com'), false),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id,
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicitly set search_path to public to prevent type/table resolution errors
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 3. Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
