-- ============================================================
-- Migration: recommendation_engine_migration
-- Purpose  : Creates tables for tracking user activity, preferences,
--            and caching recommendation results.
--
-- INSTRUCTIONS: Run this file in your Supabase SQL Editor once.
-- ============================================================

-- 1. User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  favorite_categories TEXT[] DEFAULT '{}',
  preferred_price_min NUMERIC(10, 2) DEFAULT 0,
  preferred_price_max NUMERIC(10, 2) DEFAULT 300,
  last_location_lat DOUBLE PRECISION,
  last_location_lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User activity logs table (to track CTR, conversions, and build profile views)
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL, -- 'view', 'search', 'wishlist_add', 'rent', 'recommendation_click', 'recommendation_ignore'
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_logs(created_at);

-- 3. Cache table for pre-calculated personalized recommendation feeds
CREATE TABLE IF NOT EXISTS recommendation_caches (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cached_feed JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON TABLE user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE user_preferences TO anon;

GRANT SELECT, INSERT, UPDATE ON TABLE user_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE user_activity_logs TO anon;

GRANT SELECT, INSERT, UPDATE ON TABLE recommendation_caches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE recommendation_caches TO anon;
