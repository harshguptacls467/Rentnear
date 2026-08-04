-- ============================================================
-- Migration: owner_bi_migration
-- Purpose  : Creates tables for Owner Business Intelligence (BI) Dashboard
--            caching, reports registry, and milestone alerts.
--
-- INSTRUCTIONS: Run this file in your Supabase SQL Editor once.
-- ============================================================

-- 1. Owner Analytics Cache
CREATE TABLE IF NOT EXISTS owner_analytics_caches (
  owner_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Financial Reports Registry
CREATE TABLE IF NOT EXISTS financial_reports_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'revenue', 'bookings', 'payouts', 'tax_gst', 'profit_loss'
  format TEXT NOT NULL, -- 'csv', 'excel', 'pdf'
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Owner Notifications / Alerts Table
CREATE TABLE IF NOT EXISTS owner_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_owner_notif_owner ON owner_notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_notif_read ON owner_notifications(read);
CREATE INDEX IF NOT EXISTS idx_owner_reports_owner ON financial_reports_registry(owner_id);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE owner_analytics_caches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE owner_analytics_caches TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE financial_reports_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE financial_reports_registry TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE owner_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE owner_notifications TO anon;
