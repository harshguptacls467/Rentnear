-- ============================================================
-- Migration: search_system_migration
-- Purpose  : Adds schema columns and tables to support
--            Intelligent Search & Recommendation System.
--
-- INSTRUCTIONS: Run this file in your Supabase SQL Editor once.
-- ============================================================

-- 1. Alter products table to add new search metadata fields if they do not exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS popularity_score INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT true;

-- 2. Create indexes for quick retrieval during multi-faceted filters & ranking
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_city ON products(city);
CREATE INDEX IF NOT EXISTS idx_products_locality ON products(locality);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_products_popularity ON products(popularity_score);

-- 3. Create Search Analytics table to monitor query performance, CTR, and conversion
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  results_count INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytic aggregations
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query_text);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_clicked ON search_analytics(clicked);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON TABLE search_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE search_analytics TO anon;
