-- Fix broken trigger function that references non-existent column inviter_id
-- Should use created_by instead
CREATE OR REPLACE FUNCTION public.trg_invites_usage_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.increment_usage(NEW.created_by, 'invite_sent');
  RETURN NEW;
END;
$$;