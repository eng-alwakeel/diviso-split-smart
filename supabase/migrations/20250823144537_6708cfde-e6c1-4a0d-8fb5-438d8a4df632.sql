-- إزالة حدود الإحالات الشهرية من جميع الخطط
UPDATE public.subscription_limits 
SET limit_value = -1 
WHERE action = 'invite_sent';

-- تحديث دالة assert_quota لتتجاهل فحص حدود الإحالات
CREATE OR REPLACE FUNCTION public.assert_quota(p_action text, p_user_id uuid, p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- تجاهل فحص حدود الإحالات - السماح بإحالات غير محدودة
  IF p_action = 'invite_sent' THEN
    RETURN;
  END IF;
  
  -- Get user's current plan
  v_plan := public.get_user_plan(p_user_id);
  
  -- Get the limit for this plan and action
  SELECT limit_value INTO v_limit
  FROM public.subscription_limits
  WHERE plan = v_plan AND action = p_action;
  
  -- If no limit found, allow (shouldn't happen with proper data)
  IF v_limit IS NULL THEN
    RETURN;
  END IF;
  
  -- If limit is -1, it means unlimited, so allow
  IF v_limit = -1 THEN
    RETURN;
  END IF;
  
  -- Get current count
  v_current_count := public.get_current_count(p_user_id, p_action, p_group_id);
  
  -- Check if adding one more would exceed the limit
  IF v_current_count >= v_limit THEN
    CASE p_action
      WHEN 'add_member' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من الأعضاء (%) في باقة %. قم بالترقية لإضافة المزيد من الأعضاء.', v_limit, v_plan USING ERRCODE = 'P0001';
      WHEN 'group_created' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من المجموعات (%) في باقة %. قم بالترقية لإنشاء المزيد من المجموعات.', v_limit, v_plan USING ERRCODE = 'P0001';
      WHEN 'expense_created' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من المصروفات الشهرية (%) في باقة %. قم بالترقية لإضافة المزيد من المصروفات.', v_limit, v_plan USING ERRCODE = 'P0001';
      WHEN 'ocr_used' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من استخدام OCR الشهري (%) في باقة %. قم بالترقية لاستخدام المزيد.', v_limit, v_plan USING ERRCODE = 'P0001';
      ELSE
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى للباقة %. قم بالترقية للحصول على المزيد من الميزات.', v_plan USING ERRCODE = 'P0001';
    END CASE;
  END IF;
END;
$function$;

-- حذف الدالة الموجودة وإنشاء دالة جديدة للحماية من الـ Spam
DROP FUNCTION IF EXISTS public.check_referral_spam_protection(uuid, text);

-- إنشاء دالة محسنة للحماية من الـ Spam للإحالات
CREATE OR REPLACE FUNCTION public.check_referral_spam_protection(p_user_id uuid, p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hourly_count INTEGER;
  v_existing_referral BOOLEAN;
  v_result jsonb := '{"is_allowed": true}'::jsonb;
BEGIN
  -- فحص الإحالات المتكررة لنفس الرقم
  SELECT EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE inviter_id = p_user_id 
    AND invitee_phone = p_phone
    AND created_at > now() - interval '24 hours'
  ) INTO v_existing_referral;
  
  IF v_existing_referral THEN
    v_result := jsonb_set(v_result, '{is_allowed}', 'false'::jsonb);
    v_result := jsonb_set(v_result, '{reason}', '"لقد أرسلت إحالة لهذا الرقم مؤخراً"'::jsonb);
    RETURN v_result;
  END IF;
  
  -- فحص الحد الأقصى للإحالات في الساعة الواحدة (10 إحالات)
  SELECT COUNT(*) INTO v_hourly_count
  FROM public.referrals 
  WHERE inviter_id = p_user_id 
  AND created_at > now() - interval '1 hour';
  
  IF v_hourly_count >= 10 THEN
    v_result := jsonb_set(v_result, '{is_allowed}', 'false'::jsonb);
    v_result := jsonb_set(v_result, '{reason}', '"لقد وصلت للحد الأقصى من الإحالات في الساعة الواحدة (10 إحالات). يرجى المحاولة بعد ساعة."'::jsonb);
    v_result := jsonb_set(v_result, '{retry_after}', to_jsonb(3600 - EXTRACT(epoch FROM (now() - (SELECT created_at FROM public.referrals WHERE inviter_id = p_user_id ORDER BY created_at DESC LIMIT 1)))::integer));
    RETURN v_result;
  END IF;
  
  RETURN v_result;
END;
$function$;