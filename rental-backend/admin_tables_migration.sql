-- =========================================================================
-- SQL Migration: Add Missing Admin System Schema Tables
-- =========================================================================
-- Instructions:
-- 1. Copy this entire script.
-- 2. Go to your Supabase Dashboard -> SQL Editor -> New Query.
-- 3. Paste and click "Run".
-- =========================================================================

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_secret VARCHAR(128),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- 2. Create admin_roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Create admin_role_mappings table
CREATE TABLE IF NOT EXISTS public.admin_role_mappings (
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    role_id INT REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, role_id)
);

-- 4. Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    codename VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 5. Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INT REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Add foreign key constraint to admin_audit_logs if it is missing
-- Note: We do IF NOT EXISTS mapping checks inside postgres catalog
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admin_audit_logs'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'admin_audit_logs_admin_id_fkey'
        ) THEN
            ALTER TABLE public.admin_audit_logs 
            ADD CONSTRAINT admin_audit_logs_admin_id_fkey 
            FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;
