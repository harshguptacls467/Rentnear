-- ==============================================================================
-- SECURITY PATCH: Prevent Privilege Escalation & IDOR in Supabase
-- ==============================================================================

-- 1. Prevent Users from escalating their own privileges
CREATE OR REPLACE FUNCTION public.protect_user_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is an admin, allow all changes
  IF public.is_approved_admin() THEN
    RETURN NEW;
  END IF;

  -- For regular users, ensure they cannot change sensitive columns
  NEW.is_admin := OLD.is_admin;
  NEW.admin_status := OLD.admin_status;
  NEW.is_banned := OLD.is_banned;
  NEW.kyc_verified := OLD.kyc_verified;
  NEW.kyc_status := OLD.kyc_status;
  NEW.rating_average := OLD.rating_average;
  NEW.rating_count := OLD.rating_count;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_user_sensitive_columns ON public.users;
CREATE TRIGGER tr_protect_user_sensitive_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_sensitive_columns();


-- 2. Prevent Owners from auto-approving their own products or featuring them
CREATE OR REPLACE FUNCTION public.protect_product_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_approved_admin() THEN
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.is_featured := OLD.is_featured;
  NEW.is_trending := OLD.is_trending;
  NEW.is_premium := OLD.is_premium;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_product_sensitive_columns ON public.products;
CREATE TRIGGER tr_protect_product_sensitive_columns
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_product_sensitive_columns();


-- 3. Fix Notifications Insert Policy (Prevent Spam)
DROP POLICY IF EXISTS "Users or admins insert notifications" ON public.notifications;
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  public.is_approved_admin()
);
-- Note: Service role (backend) bypasses RLS, so it can still insert notifications.
