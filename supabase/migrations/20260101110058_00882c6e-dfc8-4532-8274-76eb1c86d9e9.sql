-- Drop all conflicting versions of join_group_with_token
DROP FUNCTION IF EXISTS public.join_group_with_token(text);
DROP FUNCTION IF EXISTS public.join_group_with_token(uuid);

-- Create a single unified version that accepts text and returns uuid
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
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '22023';
  END IF;

  -- Find the token (comparing as text for flexibility)
  SELECT * INTO v_token_record
  FROM public.group_join_tokens
  WHERE token::text = p_token
    AND expires_at > now()
    AND (max_uses = -1 OR max_uses IS NULL OR current_uses < max_uses);

  IF v_token_record IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired_token' USING ERRCODE = '22023';
  END IF;

  -- Check if max uses exceeded
  IF v_token_record.max_uses IS NOT NULL 
     AND v_token_record.max_uses > 0 
     AND COALESCE(v_token_record.current_uses, 0) >= v_token_record.max_uses THEN
    RAISE EXCEPTION 'link_usage_exceeded' USING ERRCODE = '22023';
  END IF;

  -- Check if user is already a member
  SELECT id INTO v_existing_member
  FROM public.group_members
  WHERE group_id = v_token_record.group_id
    AND user_id = v_user_id;

  IF v_existing_member IS NOT NULL THEN
    -- Already a member, just return the group id
    RETURN v_token_record.group_id;
  END IF;

  -- Add user to the group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_token_record.group_id, v_user_id, v_token_record.role);

  -- Update token usage counter
  UPDATE public.group_join_tokens
  SET current_uses = COALESCE(current_uses, 0) + 1,
      used_at = now(),
      used_by = v_user_id
  WHERE id = v_token_record.id;

  RETURN v_token_record.group_id;
END;
$$;