-- Create custom ENUM types for specific status/roles
CREATE TYPE user_role AS ENUM ('renter', 'owner', 'both');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'awaiting_handover', 'active', 'completed', 'cancelled', 'disputed');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_owner', 'resolved_renter', 'resolved_split');

-- 1. USERS TABLE: If you have already run this script in Supabase, you must run this command in your SQL editor:
-- ALTER TYPE booking_status ADD VALUE 'rejected';
-- ALTER TYPE booking_status ADD VALUE 'disputed';
-- ALTER TYPE booking_status ADD VALUE 'approved';
-- ALTER TYPE booking_status ADD VALUE 'awaiting_handover';

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  trust_score INT DEFAULT 100,
  badges TEXT[] DEFAULT '{}',
  referral_code TEXT UNIQUE,
  wallet_balance NUMERIC(10, 2) DEFAULT 0,
  risk_score NUMERIC(5, 2) DEFAULT 0,
  flagged_reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REFERRALS TABLE
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, rewarded
  reward_amount NUMERIC(10, 2) DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- 2. PRODUCTS TABLE
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  condition TEXT DEFAULT 'Good',
  price_per_day NUMERIC(10, 2),
  price_per_hour NUMERIC(10, 2),
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  views_count INT DEFAULT 0,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_available BOOLEAN DEFAULT true,
  instant_booking_enabled BOOLEAN DEFAULT false,
  calendar_blocked_dates JSONB DEFAULT '[]'::jsonb,
  suggested_price_min NUMERIC(10, 2),
  suggested_price_max NUMERIC(10, 2),
  images TEXT[] DEFAULT '{}', -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BOOKINGS TABLE
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  message TEXT,
  status booking_status DEFAULT 'pending',
  parent_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  is_extension BOOLEAN DEFAULT false,
  risk_score NUMERIC(5, 2) DEFAULT 0,
  flagged_reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_bookings_product ON bookings(product_id);
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);

-- 4. HANDOVER OTPs TABLE
CREATE TABLE handover_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_handover_booking ON handover_otps(booking_id);

-- 5. CONDITION CHECKS TABLE
CREATE TABLE condition_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos TEXT[] NOT NULL,
  notes TEXT,
  is_return BOOLEAN DEFAULT false,
  ai_inspection_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_condition_booking ON condition_checks(booking_id);

-- 6. PAYMENTS TABLE
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'paid',
  payment_method TEXT DEFAULT 'mock',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- 7. MESSAGES TABLE
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_booking ON messages(booking_id);

-- 8. REVIEWS TABLE
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner_review', 'renter_review')),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- 9. DISPUTES & ESCROW CLAIMS TABLE
CREATE TABLE disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  claim_reason TEXT,
  deposit_claimed_amount NUMERIC(10, 2) DEFAULT 0,
  claim_evidence_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open', -- open, under_review, resolved, rejected
  resolution_notes TEXT,
  resolved_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_disputes_booking ON disputes(booking_id);

-- 10. PAYOUTS TABLE
CREATE TABLE payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'processed', -- pending, processing, processed, failed
  reference_id TEXT,
  payout_method TEXT DEFAULT 'UPI',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payouts_owner ON payouts(owner_id);

-- TRIGGER FUNCTION FOR AVERAGE RATINGS
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    rating_average = (
      SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviewee_id = NEW.reviewee_id
    ),
    rating_count = (
      SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- 9. DISPUTES TABLE
CREATE TABLE disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_photos TEXT[] DEFAULT '{}',
  status dispute_status DEFAULT 'open',
  admin_notes TEXT,
  resolution_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id) -- One active dispute per booking
);
CREATE INDEX idx_disputes_booking ON disputes(booking_id);

-- 10. AUDIT LOGS (TIMELINE)
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_booking ON audit_logs(booking_id);

-- TRIGGER FUNCTION FOR AUTO-LOGGING BOOKING STATUS
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (booking_id, event_type, description)
    VALUES (
      NEW.id, 
      'status_changed', 
      'Booking status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_booking_status_update
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- 12. WISHLISTS TABLE
CREATE TABLE wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- 14. USER NOTIFICATION PREFERENCES TABLE
CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  booking_notifications BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------
-- SECURITY (ROW LEVEL SECURITY POLICIES)
-------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
-- Anyone can read public profiles
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS POLICIES
-- Anyone can see available products
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
-- Only the owner can create a product
CREATE POLICY "Owners can insert products" ON products FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- Only the owner can update their product
CREATE POLICY "Owners can update own products" ON products FOR UPDATE USING (auth.uid() = owner_id);
-- Only the owner can delete their product
CREATE POLICY "Owners can delete own products" ON products FOR DELETE USING (auth.uid() = owner_id);

-- MESSAGES POLICIES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read messages in their bookings" ON messages 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT renter_id FROM bookings WHERE id = booking_id
      UNION
      SELECT owner_id FROM bookings WHERE id = booking_id
    )
  );

CREATE POLICY "Users can insert messages in their bookings" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    (SELECT is_banned FROM users WHERE id = auth.uid()) = false AND
    auth.uid() IN (
      SELECT renter_id FROM bookings WHERE id = booking_id
      UNION
      SELECT owner_id FROM bookings WHERE id = booking_id
    )
  );

-- ENABLE REALTIME
-- NOTE: Run this command in Supabase SQL editor manually if not already enabled:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- REVIEWS POLICIES
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-------------------------------------------------------
-- 11. NOTIFICATIONS
-------------------------------------------------------
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- NOTIFICATIONS POLICIES
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
-- Note: backend service role bypasses RLS to insert notifications

-- ENABLE REALTIME FOR NOTIFICATIONS
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-------------------------------------------------------
-- 12. KYC SUBMISSIONS
-------------------------------------------------------
CREATE TABLE kyc_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id_type TEXT DEFAULT 'Aadhaar Card',
  id_number TEXT NOT NULL,
  front_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'resubmission_required'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kyc_user ON kyc_submissions(user_id);

-- KYC POLICIES
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own kyc" ON kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own kyc" ON kyc_submissions FOR SELECT USING (auth.uid() = user_id);
-- Admin backend bypasses RLS using service role key

-- DISPUTES POLICIES
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read disputes for their bookings" ON disputes 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT renter_id FROM bookings WHERE id = booking_id
      UNION
      SELECT owner_id FROM bookings WHERE id = booking_id
    )
  );
CREATE POLICY "Users can insert disputes for their bookings" ON disputes 
  FOR INSERT WITH CHECK (
    auth.uid() = reported_by AND
    auth.uid() IN (
      SELECT renter_id FROM bookings WHERE id = booking_id
      UNION
      SELECT owner_id FROM bookings WHERE id = booking_id
    )
  );

-- AUDIT LOGS POLICIES
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read audit logs for their bookings" ON audit_logs 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT renter_id FROM bookings WHERE id = booking_id
      UNION
      SELECT owner_id FROM bookings WHERE id = booking_id
    )
  );

-------------------------------------------------------
-- SUPABASE STORAGE BUCKETS & POLICIES
-------------------------------------------------------

-- Create the public storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Products Bucket Policies
CREATE POLICY "Public Access for products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Authenticated users can upload products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own products" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own products" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND auth.uid() = owner);

-- Avatars Bucket Policies
CREATE POLICY "Public Access for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Condition Checks Bucket Policies
INSERT INTO storage.buckets (id, name, public) VALUES ('condition-checks', 'condition-checks', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public Access for condition checks" ON storage.objects FOR SELECT USING (bucket_id = 'condition-checks');
CREATE POLICY "Authenticated users can upload condition checks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'condition-checks' AND auth.role() = 'authenticated');

-- Disputes Bucket Policies
INSERT INTO storage.buckets (id, name, public) VALUES ('disputes', 'disputes', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public Access for disputes" ON storage.objects FOR SELECT USING (bucket_id = 'disputes');
CREATE POLICY "Authenticated users can upload disputes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'disputes' AND auth.role() = 'authenticated');

-- KYC Documents Bucket Policies (Private bucket for security)
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Users can read their own kyc documents" ON storage.objects 
  FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated users can upload kyc documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

-------------------------------------------------------
-- ADDITIONAL RLS POLICIES & SECURITY HARDENING
-------------------------------------------------------

-- BOOKINGS POLICIES
CREATE POLICY "Users can view their own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert their own booking requests" 
ON bookings FOR INSERT 
WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their own bookings" 
ON bookings FOR UPDATE 
USING (auth.uid() = renter_id OR auth.uid() = owner_id)
WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

-- PAYMENTS POLICIES
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view payments for their bookings" 
ON payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = payments.booking_id 
    AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
  )
);

-- CONDITION CHECKS POLICIES
ALTER TABLE condition_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view condition checks for their bookings" 
ON condition_checks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = condition_checks.booking_id 
    AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
  )
);

-- HANDOVER OTPS SECURITY
ALTER TABLE handover_otps ENABLE ROW LEVEL SECURITY;

-- TRIGGER FUNCTIONS SECURITY HARDENING
ALTER FUNCTION public.update_user_rating() SET search_path = public;
ALTER FUNCTION public.log_booking_status_change() SET search_path = public;

-- EVENT TRIGGER FUNCTION SECURITY HARDENING
ALTER FUNCTION public.rls_auto_enable() SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;

-- ADMIN PORTAL SYSTEM SCHEMA
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_secret VARCHAR(128),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE public.admin_role_mappings (
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    role_id INT REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, role_id)
);

CREATE TABLE public.permissions (
    id SERIAL PRIMARY KEY,
    codename VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE public.role_permissions (
    role_id INT REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and indexes on admin system tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_admins_email ON public.admins(email);

-- 17. TRUST SCORE HISTORY TABLE
CREATE TABLE trust_score_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_score INT NOT NULL,
  new_score INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trust_history_user ON trust_score_history(user_id);

-- 18. WALLET TRANSACTIONS TABLE
CREATE TABLE wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'referral_bonus', 'welcome_bonus', 'booking_discount'
  reference_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);

-- 19. PRICING RECOMMENDATIONS TABLE
CREATE TABLE pricing_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  suggested_daily_price NUMERIC(10, 2) NOT NULL,
  suggested_weekly_price NUMERIC(10, 2) NOT NULL,
  suggested_monthly_price NUMERIC(10, 2) NOT NULL,
  price_min NUMERIC(10, 2) NOT NULL,
  price_max NUMERIC(10, 2) NOT NULL,
  demand_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'peak'
  competitiveness_score INT DEFAULT 85,
  rationale JSONB DEFAULT '[]'::jsonb,
  market_stats JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pricing_rec_product ON pricing_recommendations(product_id);

-- 20. PRICING HISTORY TABLE
CREATE TABLE pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_price NUMERIC(10, 2) NOT NULL,
  new_price NUMERIC(10, 2) NOT NULL,
  applied_ai_recommendation BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pricing_hist_product ON pricing_history(product_id);

-- 21. BOOKING SCHEDULES TABLE
CREATE TABLE booking_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  handover_method TEXT NOT NULL CHECK (handover_method IN ('self_pickup', 'home_delivery')),
  handover_date DATE NOT NULL,
  handover_time_slot TEXT NOT NULL,
  handover_address TEXT NOT NULL,
  handover_latitude DOUBLE PRECISION,
  handover_longitude DOUBLE PRECISION,
  return_method TEXT NOT NULL CHECK (return_method IN ('self_return', 'home_pickup')),
  return_date DATE NOT NULL,
  return_time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_transit', 'arrived', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_booking_schedules_booking ON booking_schedules(booking_id);

-- 22. AI INTERACTIONS TABLE
CREATE TABLE ai_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  token_count INT DEFAULT 0,
  cost NUMERIC(10, 5) DEFAULT 0.00000,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ai_interactions_user ON ai_interactions(user_id);

-- 23. ORGANIZATIONS TABLE
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_logo TEXT,
  tax_id TEXT,
  business_document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  credit_limit NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. ORGANIZATIONAL MEMBERSHIPS TABLE
CREATE TABLE organization_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
CREATE INDEX idx_org_member_user ON organization_memberships(user_id);

-- 25. ORGANIZATIONAL INVITATIONS TABLE
CREATE TABLE organization_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter products and bookings tables to add organization_id
ALTER TABLE products ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 26. DEVELOPER KEYS TABLE
CREATE TABLE developer_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix VARCHAR(8) NOT NULL,
  hashed_key TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{"read:products"}'::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dev_keys_hash ON developer_keys(hashed_key);

-- 27. WEBHOOK ENDPOINTS TABLE
CREATE TABLE webhook_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{"booking.created"}'::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_webhooks_user ON webhook_endpoints(user_id);

-- 28. API LOGS TABLE
CREATE TABLE api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id UUID REFERENCES developer_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  ip_address TEXT,
  duration_ms INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_api_logs_key ON api_logs(key_id);

-- 29. API USAGE TABLE
CREATE TABLE api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id UUID NOT NULL REFERENCES developer_keys(id) ON DELETE CASCADE,
  request_count INT DEFAULT 0,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(key_id, usage_date)
);

-- 30. USER RISK SCORES TABLE
CREATE TABLE user_risk_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  risk_score INT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  factors TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_risk_val ON user_risk_scores(risk_score);

-- 31. FRAUD EVENTS TABLE
CREATE TABLE fraud_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('failed_login', 'location_mismatch', 'cancellation_spike', 'payment_failure', 'dispute_penalty')),
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fraud_events_user ON fraud_events(user_id);

-- 32. FRAUD INVESTIGATIONS TABLE
CREATE TABLE fraud_investigations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_safe', 'resolved_fraud')),
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fraud_invest_status ON fraud_investigations(status);

-- 33. TENANTS TABLE
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  branding JSONB DEFAULT '{"primary_color": "#4f46e5", "logo_url": ""}'::JSONB,
  ai_prompt_override TEXT,
  plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- Create a default tenant for existing single-tenant backward compatibility
INSERT INTO tenants (id, name, subdomain) VALUES ('00000000-0000-0000-0000-000000000000', 'Default RentNear', 'default') ON CONFLICT DO NOTHING;

-- Add column references to target tables
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE products ADD COLUMN tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE bookings ADD COLUMN tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE organizations ADD COLUMN tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000000';

-- Indexes for tenant lookups
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);

-- 34. REGIONS TABLE
CREATE TABLE regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 35. FEDERATION REGISTRY TABLE
CREATE TABLE federation_registries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  opt_in_search BOOLEAN DEFAULT true,
  revenue_share_pct NUMERIC(5, 2) DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);
CREATE INDEX idx_fed_opt_in ON federation_registries(opt_in_search);

-- 36. SETTLEMENTS TABLE
CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  to_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  net_amount NUMERIC(10, 2) NOT NULL,
  fee_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cleared')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_settlements_status ON settlements(status);

-- 37. PLUGINS TABLE
CREATE TABLE plugins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('theme', 'payment', 'analytics', 'logistics', 'crm')),
  developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 38. PLUGIN VERSIONS TABLE
CREATE TABLE plugin_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  version VARCHAR(16) NOT NULL,
  code_bundle TEXT NOT NULL,
  manifest JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plugin_id, version)
);

-- 39. PLUGIN INSTALLATIONS TABLE
CREATE TABLE plugin_installations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled')),
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plugin_id, tenant_id)
);
CREATE INDEX idx_plugin_inst_tenant ON plugin_installations(tenant_id);

-- 40. WORKFLOWS TABLE
CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);

-- 41. WORKFLOW LOGS TABLE
CREATE TABLE workflow_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  execution_status TEXT DEFAULT 'success' CHECK (execution_status IN ('success', 'failed')),
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_work_logs_flow ON workflow_logs(workflow_id);
