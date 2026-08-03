-- ============================================================
-- Migration: deduct_wallet_credit
-- Purpose  : Atomically deduct wallet credit during booking creation.
--            Eliminates the read-modify-write race condition where
--            two concurrent bookings could both read the same balance
--            and double-spend the same wallet credit.
--
-- Usage (from backend via Supabase RPC):
--   supabase.rpc('deduct_wallet_credit', { p_user_id: userId, p_amount: amount })
--   Returns: the actual amount deducted (NUMERIC), or 0 if balance is insufficient
--
-- INSTRUCTIONS: Run this entire file in your Supabase SQL editor
--               (Dashboard → SQL Editor) BEFORE deploying the updated
--               backend code. Only needs to be run once.
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_wallet_credit(
  p_user_id UUID,
  p_amount   NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance   NUMERIC;
  v_deduction NUMERIC;
BEGIN
  -- Lock the user row for the duration of this transaction.
  -- FOR UPDATE prevents any other concurrent transaction from
  -- reading or modifying this row until this function commits,
  -- which is what makes this atomic and race-condition free.
  SELECT wallet_balance
  INTO   v_balance
  FROM   users
  WHERE  id = p_user_id
  FOR UPDATE;

  -- If no row found or balance is zero, nothing to deduct.
  IF v_balance IS NULL OR v_balance <= 0 THEN
    RETURN 0;
  END IF;

  -- Deduct the lesser of: available balance vs. requested amount.
  -- This ensures wallet_balance never goes negative.
  v_deduction := LEAST(v_balance, p_amount);

  -- Apply the deduction atomically within the same transaction.
  UPDATE users
  SET    wallet_balance = wallet_balance - v_deduction
  WHERE  id = p_user_id;

  RETURN v_deduction;
END;
$$;

-- Grant execute permission to authenticated users (Supabase anon/authenticated roles)
-- The service role already has superuser access.
GRANT EXECUTE ON FUNCTION deduct_wallet_credit(UUID, NUMERIC) TO authenticated;
