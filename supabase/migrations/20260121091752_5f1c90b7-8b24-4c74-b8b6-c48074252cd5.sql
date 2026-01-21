-- Fix: Change foreign key constraint to ON DELETE SET NULL
ALTER TABLE admin_audit_log 
DROP CONSTRAINT IF EXISTS admin_audit_log_target_user_id_fkey;

ALTER TABLE admin_audit_log 
ADD CONSTRAINT admin_audit_log_target_user_id_fkey 
FOREIGN KEY (target_user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Update admin_delete_user function to capture user details before deletion
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_user_email text;
  v_user_name text;
BEGIN
  -- Verify admin privileges
  IF NOT is_admin_level_user(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent self-deletion
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  -- Capture user details before deletion for audit trail
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  SELECT COALESCE(display_name, name) INTO v_user_name FROM profiles WHERE id = p_user_id;

  -- Log the action with user details (target_user_id will become NULL after deletion)
  INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
  VALUES (v_admin_id, p_user_id, 'delete_user', jsonb_build_object(
    'reason', p_reason,
    'deleted_user_email', v_user_email,
    'deleted_user_name', v_user_name
  ));

  -- Delete the user (the new constraint will set target_user_id to NULL)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;