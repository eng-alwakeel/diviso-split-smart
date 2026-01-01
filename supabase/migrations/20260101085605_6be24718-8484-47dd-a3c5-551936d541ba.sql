-- Drop and recreate join_group_with_token with proper search_path
DROP FUNCTION IF EXISTS public.join_group_with_token(text);

CREATE OR REPLACE FUNCTION public.join_group_with_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
  v_user_id uuid;
  v_existing_member uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Get and validate token
  SELECT * INTO v_token_record
  FROM public.group_join_tokens
  WHERE token = p_token
    AND expires_at > now()
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF v_token_record IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  -- Check if already a member
  SELECT id INTO v_existing_member
  FROM public.group_members
  WHERE group_id = v_token_record.group_id
    AND user_id = v_user_id;

  IF v_existing_member IS NOT NULL THEN
    RETURN v_token_record.group_id;
  END IF;

  -- Add user to group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_token_record.group_id, v_user_id, v_token_record.role);

  -- Update token usage
  UPDATE public.group_join_tokens
  SET current_uses = current_uses + 1,
      used_at = now(),
      used_by = v_user_id
  WHERE id = v_token_record.id;

  RETURN v_token_record.group_id;
END;
$$;