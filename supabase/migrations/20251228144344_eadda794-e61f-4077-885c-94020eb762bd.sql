-- جدول مهام Onboarding للمستخدمين الجدد
CREATE TABLE public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- المهام الخمس
  profile_completed BOOLEAN DEFAULT false,
  first_group_created BOOLEAN DEFAULT false,
  first_expense_added BOOLEAN DEFAULT false,
  first_invite_sent BOOLEAN DEFAULT false,
  first_referral_made BOOLEAN DEFAULT false,
  
  -- التتبع
  tasks_completed INTEGER DEFAULT 0,
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- تفعيل RLS
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view own onboarding" ON public.onboarding_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.onboarding_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON public.onboarding_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_onboarding_tasks_updated_at
  BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- دالة إكمال مهمة
CREATE OR REPLACE FUNCTION public.complete_onboarding_task(
  p_user_id UUID,
  p_task_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_onboarding onboarding_tasks%ROWTYPE;
  v_all_completed BOOLEAN;
  v_already_completed BOOLEAN := false;
  v_coins_to_add INTEGER := 10;
BEGIN
  -- إنشاء سجل إذا لم يوجد
  INSERT INTO onboarding_tasks (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_onboarding FROM onboarding_tasks WHERE user_id = p_user_id;
  
  -- تحديث المهمة المحددة
  CASE p_task_name
    WHEN 'profile' THEN
      v_already_completed := v_onboarding.profile_completed;
      IF NOT v_already_completed THEN
        UPDATE onboarding_tasks SET profile_completed = true, 
          tasks_completed = tasks_completed + 1, updated_at = now() WHERE user_id = p_user_id;
      END IF;
    WHEN 'group' THEN
      v_already_completed := v_onboarding.first_group_created;
      IF NOT v_already_completed THEN
        UPDATE onboarding_tasks SET first_group_created = true,
          tasks_completed = tasks_completed + 1, updated_at = now() WHERE user_id = p_user_id;
      END IF;
    WHEN 'expense' THEN
      v_already_completed := v_onboarding.first_expense_added;
      IF NOT v_already_completed THEN
        UPDATE onboarding_tasks SET first_expense_added = true,
          tasks_completed = tasks_completed + 1, updated_at = now() WHERE user_id = p_user_id;
      END IF;
    WHEN 'invite' THEN
      v_already_completed := v_onboarding.first_invite_sent;
      IF NOT v_already_completed THEN
        UPDATE onboarding_tasks SET first_invite_sent = true,
          tasks_completed = tasks_completed + 1, updated_at = now() WHERE user_id = p_user_id;
      END IF;
    WHEN 'referral' THEN
      v_already_completed := v_onboarding.first_referral_made;
      IF NOT v_already_completed THEN
        UPDATE onboarding_tasks SET first_referral_made = true,
          tasks_completed = tasks_completed + 1, updated_at = now() WHERE user_id = p_user_id;
      END IF;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'invalid_task');
  END CASE;
  
  -- إضافة عملات إذا لم تكن المهمة مكتملة مسبقاً
  IF NOT v_already_completed THEN
    PERFORM add_coins(p_user_id, v_coins_to_add, 'onboarding_task', 'مكافأة مهمة: ' || p_task_name);
  END IF;
  
  -- جلب الحالة المحدثة
  SELECT * INTO v_onboarding FROM onboarding_tasks WHERE user_id = p_user_id;
  
  v_all_completed := v_onboarding.profile_completed 
    AND v_onboarding.first_group_created 
    AND v_onboarding.first_expense_added 
    AND v_onboarding.first_invite_sent 
    AND v_onboarding.first_referral_made;
  
  RETURN jsonb_build_object(
    'success', true,
    'task_completed', p_task_name,
    'already_completed', v_already_completed,
    'all_completed', v_all_completed,
    'tasks_count', v_onboarding.tasks_completed,
    'coins_earned', CASE WHEN v_already_completed THEN 0 ELSE v_coins_to_add END
  );
END;
$$;

-- دالة استلام المكافأة النهائية
CREATE OR REPLACE FUNCTION public.claim_onboarding_reward(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_onboarding onboarding_tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_onboarding FROM onboarding_tasks WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_onboarding_record');
  END IF;
  
  -- التحقق من إكمال جميع المهام
  IF NOT (v_onboarding.profile_completed AND v_onboarding.first_group_created 
    AND v_onboarding.first_expense_added AND v_onboarding.first_invite_sent 
    AND v_onboarding.first_referral_made) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_all_completed');
  END IF;
  
  -- التحقق من عدم استلام الهدية مسبقاً
  IF v_onboarding.reward_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed');
  END IF;
  
  -- إنشاء/تحديث اشتراك مع 7 أيام مجانية
  INSERT INTO user_subscriptions (user_id, plan, status, started_at, expires_at)
  VALUES (p_user_id, 'personal', 'trialing', now(), now() + interval '7 days')
  ON CONFLICT (user_id) DO UPDATE SET
    plan = 'personal',
    status = 'trialing',
    expires_at = GREATEST(user_subscriptions.expires_at, now()) + interval '7 days',
    updated_at = now();
  
  -- تحديث حالة الاستلام
  UPDATE onboarding_tasks SET 
    reward_claimed = true, 
    reward_claimed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- إضافة عملات إضافية كمكافأة نهائية
  PERFORM add_coins(p_user_id, 50, 'onboarding_complete', 'مكافأة إكمال جميع مهام البداية');
  
  RETURN jsonb_build_object(
    'success', true,
    'trial_days', 7,
    'bonus_coins', 50
  );
END;
$$;