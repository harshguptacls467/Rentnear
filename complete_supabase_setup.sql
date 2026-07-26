-- =========================================================================
-- Unified Supabase Database Setup & Sync Repair Script
-- =========================================================================
-- Instructions:
-- 1. Copy this entire script.
-- 2. Go to your Supabase Dashboard -> SQL Editor -> New Query.
-- 3. Paste and click "Run".
-- =========================================================================

-- 1. Safely create custom ENUM types if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('renter', 'owner', 'both');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'awaiting_handover', 'active', 'completed', 'cancelled', 'disputed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
        CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_owner', 'resolved_renter', 'resolved_split');
    END IF;
END $$;

-- 2. Create public.users table if it does not exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'both',
  kyc_verified BOOLEAN DEFAULT false,
  kyc_status TEXT DEFAULT 'unverified',
  rating_average NUMERIC(3, 2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  admin_status TEXT DEFAULT 'none',
  is_banned BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  aadhar_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_users_rating CHECK (rating_average >= 0.00 AND rating_average <= 5.00)
);

-- Enable Row Level Security (RLS) on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Recreate users RLS policies safely
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4. Create missing is_approved_admin() helper function
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate handle_new_user trigger function with self-healing cleanup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete any stale, left-over profile with same email/id to prevent unique constraints failure
  DELETE FROM public.users WHERE email = new.email OR id = new.id;

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
    -- Safe cast validation to prevent invalid enum casts from crashing signup
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'renter' THEN 'renter'::user_role
      WHEN new.raw_user_meta_data->>'role' = 'owner' THEN 'owner'::user_role
      ELSE 'both'::user_role
    END,
    'unverified',
    false,
    COALESCE((new.email = 'harshguptacls467@gmail.com'), false),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id,
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Bind the trigger to auth.users insertion hook
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
