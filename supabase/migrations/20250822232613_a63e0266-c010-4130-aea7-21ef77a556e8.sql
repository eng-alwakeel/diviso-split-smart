-- إصلاح التحذيرات الأمنية المتبقية

-- إصلاح search_path في جميع الـ functions المتبقية
CREATE OR REPLACE FUNCTION public.is_family_owner(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_owner_id = p_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_family_member_of(p_family_owner_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_owner_id = p_family_owner_id AND member_user_id = p_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_archived_notifications(p_months_old integer DEFAULT 3)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.notifications 
  WHERE archived_at IS NOT NULL
    AND archived_at <= now() - (p_months_old || ' months')::interval;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_old_notifications(p_user_id uuid, p_days_old integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications 
  SET archived_at = now()
  WHERE user_id = p_user_id 
    AND read_at IS NOT NULL
    AND read_at <= now() - (p_days_old || ' days')::interval
    AND archived_at IS NULL;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;
  
  UPDATE public.groups 
  SET archived_at = now()
  WHERE id = p_group_id;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.unarchive_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;
  
  UPDATE public.groups 
  SET archived_at = NULL
  WHERE id = p_group_id;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_family_invitation_token(p_token text)
RETURNS TABLE(invitation_id uuid, family_owner_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fi.id,
    fi.family_owner_id,
    fi.role
  FROM public.family_invitations fi
  WHERE fi.encrypted_token = p_token
    AND fi.status = 'pending'
    AND fi.expires_at > now()
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_count(p_user_id uuid, p_action text, p_group_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  CASE p_action
    WHEN 'add_member' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.group_members gm
      WHERE gm.group_id = p_group_id;
      
    WHEN 'group_created' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.groups g
      WHERE g.owner_id = p_user_id;
      
    WHEN 'expense_created' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.expenses e
      WHERE e.created_by = p_user_id
        AND e.created_at >= date_trunc('month', now());
        
    WHEN 'invite_sent' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.invites i
      WHERE i.created_by = p_user_id
        AND i.created_at >= date_trunc('month', now());
        
    WHEN 'ocr_used' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.receipt_ocr r
      WHERE r.created_by = p_user_id
        AND r.created_at >= date_trunc('month', now());
        
    ELSE
      v_count := 0;
  END CASE;
  
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_phone_invite(p_token uuid, p_phone text)
RETURNS TABLE(success boolean, group_id uuid, message text, needs_phone_confirmation boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.get_remaining_trial_days(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subscription RECORD;
  v_total_days_used INTEGER := 0;
  v_max_trial_days INTEGER := 7;
BEGIN
  SELECT 
    first_trial_started_at,
    total_trial_days_used,
    status
  INTO v_subscription
  FROM public.user_subscriptions 
  WHERE user_id = p_user_id;
  
  -- If no subscription exists, user gets full trial
  IF NOT FOUND THEN
    RETURN v_max_trial_days;
  END IF;
  
  -- If never started a trial, user gets full trial
  IF v_subscription.first_trial_started_at IS NULL THEN
    RETURN v_max_trial_days;
  END IF;
  
  -- Calculate days used based on first trial start
  v_total_days_used := GREATEST(
    COALESCE(v_subscription.total_trial_days_used, 0),
    EXTRACT(DAY FROM (now() - v_subscription.first_trial_started_at))::INTEGER
  );
  
  -- Return remaining days (minimum 0)
  RETURN GREATEST(0, v_max_trial_days - v_total_days_used);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Temporary no-op: do nothing. Replace with real tracking later if needed.
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_successful_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- إذا تم تحديث الحالة إلى 'joined'
  IF OLD.status != 'joined' AND NEW.status = 'joined' THEN
    -- إضافة مكافأة للمُحيل
    INSERT INTO public.referral_rewards (user_id, referral_id, days_earned)
    VALUES (NEW.inviter_id, NEW.id, NEW.reward_days);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- التأكد من عدم وجود رمز إحالة مسبقاً لهذا المستخدم
  IF NOT EXISTS (SELECT 1 FROM public.user_referral_codes WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_referral_codes (user_id, referral_code)
    VALUES (NEW.id, public.generate_referral_code());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(total_users bigint, total_groups bigint, total_expenses bigint, total_amount numeric, active_subscriptions bigint, monthly_revenue numeric, new_users_this_month bigint, active_users_today bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.groups) as total_groups,
    (SELECT COUNT(*) FROM public.expenses WHERE status = 'approved') as total_expenses,
    (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE status = 'approved') as total_amount,
    (SELECT COUNT(*) FROM public.user_subscriptions WHERE status IN ('active', 'trialing')) as active_subscriptions,
    (SELECT COALESCE(SUM(
      CASE 
        WHEN us.plan = 'premium' THEN 29.99
        WHEN us.plan = 'family' THEN 49.99
        ELSE 0
      END
    ), 0) FROM public.user_subscriptions us WHERE us.status = 'active') as monthly_revenue,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= date_trunc('month', now())) as new_users_this_month,
    (SELECT COUNT(DISTINCT user_id) FROM public.expenses WHERE created_at >= current_date) as active_users_today;
END;
$$;