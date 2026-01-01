-- ============================================
-- Phase 1: Fix RLS policy for user_roles
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create new policy allowing admins to view all roles
CREATE POLICY "Users can view roles" ON user_roles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR is_admin_level_user(auth.uid())
);

-- ============================================
-- Phase 2: Add new columns to profiles table
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_admin_action_at timestamptz;

-- ============================================
-- Phase 3: Create admin audit log table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
FOR SELECT TO authenticated
USING (is_admin_level_user(auth.uid()));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs" ON admin_audit_log
FOR INSERT TO authenticated
WITH CHECK (is_admin_level_user(auth.uid()));

-- ============================================
-- Phase 4: Admin functions for user management
-- ============================================

-- Function to update user profile
CREATE OR REPLACE FUNCTION admin_update_user_profile(
  p_user_id uuid,
  p_display_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  -- Check admin permission
  IF NOT is_admin_level_user(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Update profile
  UPDATE profiles
  SET 
    display_name = COALESCE(p_display_name, display_name),
    phone = COALESCE(p_phone, phone),
    updated_at = now(),
    last_admin_action_at = now()
  WHERE id = p_user_id;

  -- Log the action
  INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
  VALUES (v_admin_id, p_user_id, 'update_profile', jsonb_build_object(
    'display_name', p_display_name,
    'phone', p_phone
  ));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to ban/unban user
CREATE OR REPLACE FUNCTION admin_ban_user(
  p_user_id uuid,
  p_is_banned boolean,
  p_reason text DEFAULT NULL,
  p_ban_until timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  -- Check admin permission
  IF NOT is_admin_level_user(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent banning yourself
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  -- Update profile
  UPDATE profiles
  SET 
    is_banned = p_is_banned,
    ban_reason = CASE WHEN p_is_banned THEN p_reason ELSE NULL END,
    banned_until = CASE WHEN p_is_banned THEN p_ban_until ELSE NULL END,
    banned_by = CASE WHEN p_is_banned THEN v_admin_id ELSE NULL END,
    last_admin_action_at = now(),
    updated_at = now()
  WHERE id = p_user_id;

  -- Log the action
  INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
  VALUES (v_admin_id, p_user_id, CASE WHEN p_is_banned THEN 'ban_user' ELSE 'unban_user' END, jsonb_build_object(
    'reason', p_reason,
    'ban_until', p_ban_until
  ));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to manage credits
CREATE OR REPLACE FUNCTION admin_manage_credits(
  p_user_id uuid,
  p_amount integer,
  p_operation text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_credit_id uuid;
BEGIN
  -- Check admin permission
  IF NOT is_admin_level_user(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate operation
  IF p_operation NOT IN ('grant', 'deduct') THEN
    RAISE EXCEPTION 'Invalid operation: must be grant or deduct';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- For grant: insert new credits
  IF p_operation = 'grant' THEN
    INSERT INTO usage_credits (user_id, credits_remaining, source, expires_at)
    VALUES (p_user_id, p_amount, 'admin_grant', now() + interval '1 year')
    RETURNING id INTO v_credit_id;
  END IF;

  -- For deduct: reduce from existing credits
  IF p_operation = 'deduct' THEN
    UPDATE usage_credits
    SET credits_remaining = GREATEST(0, credits_remaining - p_amount)
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND credits_remaining > 0
    RETURNING id INTO v_credit_id;
  END IF;

  -- Log the action
  INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
  VALUES (v_admin_id, p_user_id, p_operation || '_credits', jsonb_build_object(
    'amount', p_amount,
    'reason', p_reason
  ));

  -- Log in credit consumption
  INSERT INTO credit_consumption_log (user_id, credit_id, action_type, amount_consumed, metadata)
  VALUES (p_user_id, v_credit_id, 'admin_' || p_operation, p_amount, jsonb_build_object(
    'admin_id', v_admin_id,
    'reason', p_reason
  ));

  RETURN jsonb_build_object('success', true, 'credit_id', v_credit_id);
END;
$$;

-- Function to delete user (soft delete - archives data)
CREATE OR REPLACE FUNCTION admin_delete_user(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  -- Check admin permission
  IF NOT is_admin_level_user(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent deleting yourself
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  -- Log the action before deletion
  INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
  VALUES (v_admin_id, p_user_id, 'delete_user', jsonb_build_object(
    'reason', p_reason
  ));

  -- Delete user from auth.users (this will cascade to profiles due to FK)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- Phase 5: Add new permissions
-- ============================================

INSERT INTO role_permissions (role, permission) VALUES
('admin', 'users.ban'),
('admin', 'users.delete'),
('admin', 'credits.grant'),
('admin', 'credits.deduct'),
('finance_admin', 'credits.grant'),
('finance_admin', 'credits.deduct'),
('support_agent', 'users.view')
ON CONFLICT (role, permission) DO NOTHING;