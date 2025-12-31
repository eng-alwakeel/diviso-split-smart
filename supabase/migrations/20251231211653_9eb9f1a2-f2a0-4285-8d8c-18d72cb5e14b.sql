-- إزالة مكافآت العملات من نظام الـ Onboarding وتحويله لنظام تدريب فقط

-- تعديل دالة complete_onboarding_task (بدون مكافآت)
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
BEGIN
  -- إنشاء سجل إذا لم يوجد
  INSERT INTO onboarding_tasks (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_onboarding FROM onboarding_tasks WHERE user_id = p_user_id;
  
  -- تحديث المهمة المحددة (بدون مكافآت)
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
    'tasks_count', v_onboarding.tasks_completed
  );
END;
$$;

-- تعديل دالة claim_onboarding_reward (تأكيد إكمال فقط بدون مكافآت)
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
  
  -- التحقق من عدم التأكيد مسبقاً
  IF v_onboarding.reward_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed');
  END IF;
  
  -- تحديث حالة الإكمال فقط (بدون مكافآت)
  UPDATE onboarding_tasks SET 
    reward_claimed = true, 
    reward_claimed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم إكمال التدريب بنجاح'
  );
END;
$$;