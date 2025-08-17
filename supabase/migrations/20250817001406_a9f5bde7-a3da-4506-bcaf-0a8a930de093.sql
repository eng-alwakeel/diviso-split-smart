-- Enhance invites table with token and additional tracking fields
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS invite_type TEXT DEFAULT 'phone',
ADD COLUMN IF NOT EXISTS invite_source TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- Create unique index on invite_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_token ON public.invites(invite_token);

-- Create function to handle phone-based invite acceptance
CREATE OR REPLACE FUNCTION public.accept_phone_invite(
  p_token UUID,
  p_phone TEXT
) 
RETURNS TABLE(
  success BOOLEAN,
  group_id UUID,
  message TEXT,
  needs_phone_confirmation BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_existing_member BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'يجب تسجيل الدخول أولاً'::TEXT, false;
    RETURN;
  END IF;

  -- Find the invite
  SELECT * INTO v_invite
  FROM public.invites 
  WHERE invite_token = p_token 
    AND status = 'sent'
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 'رابط الدعوة غير صالح أو منتهي الصلاحية'::TEXT, false;
    RETURN;
  END IF;

  -- Check if user's phone matches invite phone
  IF v_invite.phone_or_email != p_phone THEN
    -- Update user's phone if not set
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND phone = p_phone) THEN
      INSERT INTO public.profiles (id, phone) 
      VALUES (v_user_id, p_phone)
      ON CONFLICT (id) DO UPDATE SET 
        phone = EXCLUDED.phone,
        updated_at = now();
    END IF;
  END IF;

  -- Check if already a member
  SELECT EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = v_invite.group_id AND user_id = v_user_id
  ) INTO v_existing_member;
  
  IF v_existing_member THEN
    RETURN QUERY SELECT true, v_invite.group_id, 'أنت عضو في هذه المجموعة بالفعل'::TEXT, false;
    RETURN;
  END IF;

  -- Add user to group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_invite.group_id, v_user_id, v_invite.invited_role);

  -- Update invite status
  UPDATE public.invites 
  SET 
    status = 'accepted',
    accepted_by = v_user_id,
    accepted_at = now()
  WHERE id = v_invite.id;

  -- Process referral if this came from a referral
  IF v_invite.created_by != v_user_id THEN
    -- Check if there's a matching referral
    UPDATE public.referrals 
    SET 
      status = 'joined',
      joined_at = now()
    WHERE inviter_id = v_invite.created_by 
      AND invitee_phone = v_invite.phone_or_email
      AND status = 'pending';
  END IF;

  RETURN QUERY SELECT true, v_invite.group_id, 'تم الانضمام للمجموعة بنجاح!'::TEXT, false;
END;
$$;