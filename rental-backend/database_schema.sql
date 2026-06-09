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
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_available BOOLEAN DEFAULT true,
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
  id_type TEXT NOT NULL,
  front_url TEXT NOT NULL,
  back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
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
