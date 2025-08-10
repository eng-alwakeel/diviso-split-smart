
-- Create no-op quota check to unblock inserts that call it via triggers
CREATE OR REPLACE FUNCTION public.assert_quota(
  p_action text,
  p_user_id uuid,
  p_group_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Temporary no-op: always allow. Replace with real logic later if needed.
  RETURN;
END;
$$;

-- Create no-op usage increment function to satisfy existing calls
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_action text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Temporary no-op: do nothing. Replace with real tracking later if needed.
  RETURN;
END;
$$;
