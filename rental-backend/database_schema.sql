-- Create custom ENUM types for specific status/roles
CREATE TYPE user_role AS ENUM ('owner', 'renter', 'both');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled');

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'both',
  kyc_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
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
  status booking_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_bookings_product ON bookings(product_id);
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);

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
