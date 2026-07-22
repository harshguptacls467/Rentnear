-- ==============================================================================
-- RENTNEAR SUPABASE REALTIME & ADMIN PRODUCTION DATABASE SETUP
-- ==============================================================================
-- Run this SQL script in your Supabase Dashboard -> SQL Editor
-- to ensure all tables, columns, indexes, policies, and realtime publications
-- are fully initialized for the production-ready Admin Dashboard and live platform.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('renter', 'owner', 'both');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'awaiting_handover', 'active', 'completed', 'cancelled', 'disputed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_owner', 'resolved_renter', 'resolved_split');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'both',
  location TEXT,
  kyc_verified BOOLEAN DEFAULT false,
  kyc_status TEXT DEFAULT 'unverified', -- 'unverified', 'pending', 'verified', 'rejected'
  rating_average NUMERIC(3, 2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  admin_status TEXT DEFAULT 'none', -- 'none', 'pending', 'approved', 'rejected'
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all user columns exist if table was previously created
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'unverified';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_status TEXT DEFAULT 'none';

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  condition TEXT DEFAULT 'Good',
  price_per_day NUMERIC(10, 2) NOT NULL,
  price_per_hour NUMERIC(10, 2),
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_available BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'hidden'
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  message TEXT,
  status booking_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. KYC SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  id_type TEXT NOT NULL,
  id_number TEXT,
  front_url TEXT NOT NULL,
  back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_photos TEXT[] DEFAULT '{}',
  status dispute_status DEFAULT 'open',
  admin_notes TEXT,
  resolution_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'captured', -- 'captured', 'refunded', 'pending'
  payment_method TEXT DEFAULT 'stripe',
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_url TEXT,
  seo_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an approved admin
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true AND admin_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users RLS
DROP POLICY IF EXISTS "Public users viewable by all" ON public.users;
CREATE POLICY "Public users viewable by all" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own or admin updates" ON public.users;
CREATE POLICY "Users update own or admin updates" ON public.users FOR UPDATE USING (
  auth.uid() = id OR public.is_approved_admin()
);

DROP POLICY IF EXISTS "Users insert own profile" ON public.users;
CREATE POLICY "Users insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Products RLS
DROP POLICY IF EXISTS "Products viewable by all" ON public.products;
CREATE POLICY "Products viewable by all" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners insert products" ON public.products;
CREATE POLICY "Owners insert products" ON public.products FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners or Admins update products" ON public.products;
CREATE POLICY "Owners or Admins update products" ON public.products FOR UPDATE USING (
  auth.uid() = owner_id OR public.is_approved_admin()
);

DROP POLICY IF EXISTS "Owners or Admins delete products" ON public.products;
CREATE POLICY "Owners or Admins delete products" ON public.products FOR DELETE USING (
  auth.uid() = owner_id OR public.is_approved_admin()
);

-- Bookings RLS
DROP POLICY IF EXISTS "Bookings viewable by participants or admin" ON public.bookings;
CREATE POLICY "Bookings viewable by participants or admin" ON public.bookings FOR SELECT USING (
  auth.uid() = renter_id OR auth.uid() = owner_id OR public.is_approved_admin()
);

DROP POLICY IF EXISTS "Renters insert bookings" ON public.bookings;
CREATE POLICY "Renters insert bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = renter_id);

DROP POLICY IF EXISTS "Participants or Admins update bookings" ON public.bookings;
CREATE POLICY "Participants or Admins update bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = renter_id OR auth.uid() = owner_id OR public.is_approved_admin()
);

-- KYC RLS
DROP POLICY IF EXISTS "Users insert own kyc" ON public.kyc_submissions;
CREATE POLICY "Users insert own kyc" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own kyc or admin views all" ON public.kyc_submissions;
CREATE POLICY "Users view own kyc or admin views all" ON public.kyc_submissions FOR SELECT USING (
  auth.uid() = user_id OR public.is_approved_admin()
);

DROP POLICY IF EXISTS "Admins update kyc" ON public.kyc_submissions;
CREATE POLICY "Admins update kyc" ON public.kyc_submissions FOR UPDATE USING (public.is_approved_admin());

-- Disputes RLS
DROP POLICY IF EXISTS "Disputes viewable by participants or admin" ON public.disputes;
CREATE POLICY "Disputes viewable by participants or admin" ON public.disputes FOR SELECT USING (
  auth.uid() = reported_by OR public.is_approved_admin() OR EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_id AND (renter_id = auth.uid() OR owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users insert disputes" ON public.disputes;
CREATE POLICY "Users insert disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Admins update disputes" ON public.disputes;
CREATE POLICY "Admins update disputes" ON public.disputes FOR UPDATE USING (public.is_approved_admin());

-- Payments RLS
DROP POLICY IF EXISTS "Payments viewable by participants or admin" ON public.payments;
CREATE POLICY "Payments viewable by participants or admin" ON public.payments FOR SELECT USING (
  public.is_approved_admin() OR EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_id AND (renter_id = auth.uid() OR owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins update payments" ON public.payments;
CREATE POLICY "Admins update payments" ON public.payments FOR UPDATE USING (public.is_approved_admin());

-- Notifications RLS
DROP POLICY IF EXISTS "Notifications viewable by recipient or admin" ON public.notifications;
CREATE POLICY "Notifications viewable by recipient or admin" ON public.notifications FOR SELECT USING (
  auth.uid() = user_id OR public.is_approved_admin()
);

DROP POLICY IF EXISTS "Notifications update by recipient" ON public.notifications;
CREATE POLICY "Notifications update by recipient" ON public.notifications FOR UPDATE USING (
  auth.uid() = user_id OR public.is_approved_admin()
);

DROP POLICY IF EXISTS "Users or admins insert notifications" ON public.notifications;
CREATE POLICY "Users or admins insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Admin Audit Logs RLS
DROP POLICY IF EXISTS "Admins view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.is_approved_admin());

DROP POLICY IF EXISTS "Admins insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (auth.uid() = admin_id OR public.is_approved_admin());

-- Categories & Banners RLS
DROP POLICY IF EXISTS "Anyone view categories" ON public.categories;
CREATE POLICY "Anyone view categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.is_approved_admin());

DROP POLICY IF EXISTS "Anyone view banners" ON public.banners;
CREATE POLICY "Anyone view banners" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL USING (public.is_approved_admin());

-- ==============================================================================
-- ENABLE REALTIME PUBLICATION FOR ALL CORE TABLES
-- ==============================================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_submissions;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN null; END $$;
