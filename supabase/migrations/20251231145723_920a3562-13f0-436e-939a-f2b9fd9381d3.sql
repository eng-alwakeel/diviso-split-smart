-- ===========================================
-- نظام الدعوات المبني على الجودة (Quality-Based Referral Rewards)
-- ===========================================

-- جدول لتتبع مراحل تقدم المدعوين
CREATE TABLE public.referral_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  -- مراحل التقدم
  signup_completed BOOLEAN DEFAULT true,
  first_usage_at TIMESTAMPTZ,  -- أول استخدام فعلي (مصروف)
  first_group_or_settlement_at TIMESTAMPTZ,  -- أول قروب/تسوية
  active_7_days_at TIMESTAMPTZ,  -- نشط 7 أيام
  subscribed_at TIMESTAMPTZ,  -- اشترك
  -- النقاط الممنوحة لكل مرحلة
  points_for_signup INTEGER DEFAULT 0,
  points_for_first_usage INTEGER DEFAULT 0,
  points_for_group_settlement INTEGER DEFAULT 0,
  points_for_active_7_days INTEGER DEFAULT 0,
  points_for_subscription INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referral_id)
);

-- Indexes للأداء
CREATE INDEX idx_referral_progress_inviter ON public.referral_progress(inviter_id);
CREATE INDEX idx_referral_progress_invitee ON public.referral_progress(invitee_id);
CREATE INDEX idx_referral_progress_first_usage ON public.referral_progress(first_usage_at) WHERE first_usage_at IS NULL;

-- Enable RLS
ALTER TABLE public.referral_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referral progress (as inviter)
CREATE POLICY "Users can view own referral progress" 
ON public.referral_progress
FOR SELECT 
USING (auth.uid() = inviter_id);

-- ===========================================
-- دالة: منح نقاط أول استخدام (10 RP)
-- ===========================================
CREATE OR REPLACE FUNCTION public.grant_referral_first_usage_bonus(
  p_invitee_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_progress referral_progress%ROWTYPE;
  v_reward_amount INTEGER := 10;
BEGIN
  -- Find the referral progress for this invitee
  SELECT * INTO v_progress
  FROM referral_progress
  WHERE invitee_id = p_invitee_id
    AND first_usage_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_pending_referral_or_already_granted'
    );
  END IF;

  -- Update the progress record
  UPDATE referral_progress
  SET first_usage_at = now(),
      points_for_first_usage = v_reward_amount,
      total_points = total_points + v_reward_amount,
      updated_at = now()
  WHERE id = v_progress.id;

  -- Add usage credits for the inviter (7 days validity)
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    v_progress.inviter_id, 
    v_reward_amount, 
    'referral_bonus',
    'مكافأة: أول استخدام للمدعو',
    now() + interval '7 days'
  );

  -- Create notification for inviter
  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    v_progress.inviter_id,
    'referral_milestone',
    jsonb_build_object(
      'milestone', 'first_usage',
      'points', v_reward_amount,
      'message_ar', 'المدعو استخدم التطبيق لأول مرة! +10 نقاط'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'milestone', 'first_usage',
    'points_granted', v_reward_amount,
    'inviter_id', v_progress.inviter_id
  );
END;
$$;

-- ===========================================
-- دالة: منح نقاط أول قروب/تسوية (20 RP)
-- ===========================================
CREATE OR REPLACE FUNCTION public.grant_referral_milestone_bonus(
  p_invitee_id UUID,
  p_milestone_type TEXT  -- 'group' أو 'settlement'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_progress referral_progress%ROWTYPE;
  v_reward_amount INTEGER := 20;
BEGIN
  -- Validate milestone type
  IF p_milestone_type NOT IN ('group', 'settlement') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_milestone_type'
    );
  END IF;

  -- Find the referral progress for this invitee
  SELECT * INTO v_progress
  FROM referral_progress
  WHERE invitee_id = p_invitee_id
    AND first_group_or_settlement_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_pending_referral_or_already_granted'
    );
  END IF;

  -- Update the progress record
  UPDATE referral_progress
  SET first_group_or_settlement_at = now(),
      points_for_group_settlement = v_reward_amount,
      total_points = total_points + v_reward_amount,
      updated_at = now()
  WHERE id = v_progress.id;

  -- Add usage credits for the inviter (7 days validity)
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    v_progress.inviter_id, 
    v_reward_amount, 
    'referral_bonus',
    CASE p_milestone_type 
      WHEN 'group' THEN 'مكافأة: المدعو أنشأ أول قروب'
      ELSE 'مكافأة: المدعو أجرى أول تسوية'
    END,
    now() + interval '7 days'
  );

  -- Create notification for inviter
  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    v_progress.inviter_id,
    'referral_milestone',
    jsonb_build_object(
      'milestone', p_milestone_type,
      'points', v_reward_amount,
      'message_ar', CASE p_milestone_type 
        WHEN 'group' THEN 'المدعو أنشأ قروب! +20 نقاط'
        ELSE 'المدعو أجرى تسوية! +20 نقاط'
      END
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'milestone', p_milestone_type,
    'points_granted', v_reward_amount,
    'inviter_id', v_progress.inviter_id
  );
END;
$$;

-- ===========================================
-- دالة: منح نقاط 7 أيام نشاط (5 RP) - تُشغل بـ cron
-- ===========================================
CREATE OR REPLACE FUNCTION public.check_and_grant_active_7_days_bonus()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_progress RECORD;
  v_reward_amount INTEGER := 5;
  v_count INTEGER := 0;
  v_last_activity TIMESTAMPTZ;
BEGIN
  FOR v_progress IN 
    SELECT rp.*, r.joined_at
    FROM referral_progress rp
    JOIN referrals r ON r.id = rp.referral_id
    WHERE rp.active_7_days_at IS NULL
      AND rp.first_usage_at IS NOT NULL
      AND r.joined_at <= now() - interval '7 days'
  LOOP
    -- Check if invitee was active in last 7 days (has expenses or settlements)
    SELECT MAX(created_at) INTO v_last_activity
    FROM (
      SELECT created_at FROM expenses WHERE created_by = v_progress.invitee_id AND created_at >= now() - interval '7 days'
      UNION ALL
      SELECT created_at FROM settlements WHERE from_user_id = v_progress.invitee_id AND created_at >= now() - interval '7 days'
    ) activity;

    IF v_last_activity IS NOT NULL THEN
      -- User was active - grant bonus
      UPDATE referral_progress
      SET active_7_days_at = now(),
          points_for_active_7_days = v_reward_amount,
          total_points = total_points + v_reward_amount,
          updated_at = now()
      WHERE id = v_progress.id;

      -- Add usage credits for the inviter
      INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
      VALUES (
        v_progress.inviter_id, 
        v_reward_amount, 
        'referral_bonus',
        'مكافأة: المدعو نشط 7 أيام',
        now() + interval '7 days'
      );

      -- Create notification
      INSERT INTO notifications (user_id, type, payload)
      VALUES (
        v_progress.inviter_id,
        'referral_milestone',
        jsonb_build_object(
          'milestone', 'active_7_days',
          'points', v_reward_amount,
          'message_ar', 'المدعو نشط منذ 7 أيام! +5 نقاط'
        )
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ===========================================
-- دالة: منح نقاط الاشتراك (20 RP)
-- ===========================================
CREATE OR REPLACE FUNCTION public.grant_referral_subscription_bonus(
  p_invitee_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_progress referral_progress%ROWTYPE;
  v_reward_amount INTEGER := 20;
BEGIN
  -- Find the referral progress for this invitee
  SELECT * INTO v_progress
  FROM referral_progress
  WHERE invitee_id = p_invitee_id
    AND subscribed_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_pending_referral_or_already_granted'
    );
  END IF;

  -- Update the progress record
  UPDATE referral_progress
  SET subscribed_at = now(),
      points_for_subscription = v_reward_amount,
      total_points = total_points + v_reward_amount,
      updated_at = now()
  WHERE id = v_progress.id;

  -- Add usage credits for the inviter (7 days validity)
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    v_progress.inviter_id, 
    v_reward_amount, 
    'referral_bonus',
    'مكافأة: المدعو اشترك!',
    now() + interval '7 days'
  );

  -- Create notification for inviter
  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    v_progress.inviter_id,
    'referral_milestone',
    jsonb_build_object(
      'milestone', 'subscribed',
      'points', v_reward_amount,
      'message_ar', 'المدعو اشترك في خطة مدفوعة! +20 نقاط 🎉'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'milestone', 'subscribed',
    'points_granted', v_reward_amount,
    'inviter_id', v_progress.inviter_id
  );
END;
$$;

-- ===========================================
-- Update reward_points CHECK constraint
-- ===========================================
ALTER TABLE public.reward_points 
DROP CONSTRAINT IF EXISTS reward_points_source_check;

ALTER TABLE public.reward_points 
ADD CONSTRAINT reward_points_source_check 
CHECK (source IN ('daily_login', 'streak', 'referral', 'referral_quality', 'interaction', 'recommendation', 'referral_bonus', 'referral_first_usage', 'referral_group_settlement', 'referral_active_7_days', 'referral_subscribed'));

-- ===========================================
-- Update usage_credits source CHECK if exists
-- ===========================================
DO $$
BEGIN
  -- Check if constraint exists and update it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'usage_credits_source_check' 
    AND table_name = 'usage_credits'
  ) THEN
    ALTER TABLE public.usage_credits DROP CONSTRAINT usage_credits_source_check;
  END IF;
END $$;