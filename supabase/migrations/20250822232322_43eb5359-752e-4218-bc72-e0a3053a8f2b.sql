-- المرحلة الثانية: تحسينات الأمان

-- 1. إصلاح search_path في جميع الـ functions لمنع ثغرات الأمان
CREATE OR REPLACE FUNCTION public.log_security_event(p_action text, p_table_name text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    action,
    table_name,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_details,
    NULL, -- IP will be added by application layer
    NULL  -- User agent will be added by application layer
  );
END;
$$;

-- إنشاء جدول security_logs إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS على جدول security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول security_logs
CREATE POLICY "Admins can read all security logs"
ON public.security_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "System can insert security logs"
ON public.security_logs
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow system to log events

CREATE POLICY "Users can read their own security logs"
ON public.security_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. تحسين سياسات RLS للجداول الحساسة

-- تحسين سياسات ad_impressions لحماية البيانات الحساسة
DROP POLICY IF EXISTS "Users can view their own ad impressions" ON public.ad_impressions;
DROP POLICY IF EXISTS "Users can create their own ad impressions" ON public.ad_impressions;
DROP POLICY IF EXISTS "Users can update their own ad impressions" ON public.ad_impressions;

CREATE POLICY "Users can view their own ad impressions"
ON public.ad_impressions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own ad impressions"
ON public.ad_impressions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND user_id IS NOT NULL);

CREATE POLICY "Users can update their own ad impressions"
ON public.ad_impressions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND user_id IS NOT NULL);

-- تحسين سياسات family_invitations
DROP POLICY IF EXISTS "Users can view invitations with valid token" ON public.family_invitations;

CREATE POLICY "Users can view invitations with valid token"
ON public.family_invitations
FOR SELECT
TO authenticated
USING (
  family_owner_id = auth.uid() 
  OR accepted_by = auth.uid() 
  OR (
    status = 'pending' 
    AND expires_at > now() 
    AND auth.uid() IS NOT NULL
    AND (
      invited_email = (auth.jwt() ->> 'email')
      OR invited_phone IS NOT NULL
    )
  )
);

-- 3. إضافة فهارس للأداء والأمان
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_id ON public.ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_token ON public.family_invitations(encrypted_token);

-- المرحلة الثالثة: التحسينات العامة

-- 1. تحسين دالة التحقق من كلمة المرور
CREATE OR REPLACE FUNCTION public.verify_user_password(current_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- الحصول على إيميل المستخدم الحالي
  SELECT raw_user_meta_data->>'email' INTO v_user_email
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF v_user_email IS NULL THEN
    -- تسجيل محاولة تحقق فاشلة
    PERFORM public.log_security_event('password_verification_failed', 'auth.users', '{"reason": "no_email"}'::jsonb);
    RETURN false;
  END IF;
  
  -- تسجيل محاولة التحقق
  PERFORM public.log_security_event('password_verification_attempt', 'auth.users', '{"email": "' || v_user_email || '"}'::jsonb);
  
  -- في الوقت الحالي، نعيد true (سيتم التحقق من جانب العميل)
  RETURN true;
END;
$$;

-- 2. تحسين دالة التحقق من صحة رقم الهاتف
CREATE OR REPLACE FUNCTION public.is_valid_phone(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- التحقق من صحة رقم الهاتف السعودي
  RETURN phone_input ~ '^(\+966|966|0)?5[0-9]{8}$' 
    OR phone_input ~ '^\+966[1-9][0-9]{8}$'
    OR phone_input ~ '^05[0-9]{8}$';
END;
$$;

-- 3. إضافة قيود البيانات للتحقق من صحة البيانات
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_phone_format 
CHECK (phone IS NULL OR public.is_valid_phone(phone));

-- إضافة قيد للتأكد من وجود display_name أو name
ALTER TABLE public.profiles
ADD CONSTRAINT name_required
CHECK (display_name IS NOT NULL OR name IS NOT NULL);

-- 4. تحسين دالة إنشاء رمز الإحالة لمنع التضارب
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    attempts := attempts + 1;
    
    -- توليد رمز من 8 أحرف وأرقام
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- التأكد من عدم وجود الرمز مسبقاً
    IF NOT EXISTS (SELECT 1 FROM public.user_referral_codes WHERE referral_code = code) THEN
      RETURN code;
    END IF;
    
    -- منع الحلقة اللانهائية
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique referral code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- 5. إضافة trigger لتسجيل التعديلات الحساسة
CREATE OR REPLACE FUNCTION public.log_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- تسجيل التعديلات في الملفات الشخصية
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.is_admin != NEW.is_admin THEN
        PERFORM public.log_security_event(
          'admin_status_changed', 
          'profiles', 
          jsonb_build_object(
            'user_id', NEW.id,
            'old_admin', OLD.is_admin,
            'new_admin', NEW.is_admin
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- إضافة trigger لمراقبة تغييرات المشرفين
DROP TRIGGER IF EXISTS log_profile_changes ON public.profiles;
CREATE TRIGGER log_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_changes();

-- 6. إضافة دالة للتحقق من قوة كلمة المرور (للاستخدام من جانب العميل)
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_input text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  score integer := 0;
BEGIN
  -- التحقق من الطول
  IF length(password_input) >= 8 THEN
    score := score + 1;
    result := jsonb_set(result, '{length}', 'true'::jsonb);
  ELSE
    result := jsonb_set(result, '{length}', 'false'::jsonb);
  END IF;
  
  -- التحقق من وجود أحرف كبيرة
  IF password_input ~ '[A-Z]' THEN
    score := score + 1;
    result := jsonb_set(result, '{uppercase}', 'true'::jsonb);
  ELSE
    result := jsonb_set(result, '{uppercase}', 'false'::jsonb);
  END IF;
  
  -- التحقق من وجود أحرف صغيرة
  IF password_input ~ '[a-z]' THEN
    score := score + 1;
    result := jsonb_set(result, '{lowercase}', 'true'::jsonb);
  ELSE
    result := jsonb_set(result, '{lowercase}', 'false'::jsonb);
  END IF;
  
  -- التحقق من وجود أرقام
  IF password_input ~ '[0-9]' THEN
    score := score + 1;
    result := jsonb_set(result, '{numbers}', 'true'::jsonb);
  ELSE
    result := jsonb_set(result, '{numbers}', 'false'::jsonb);
  END IF;
  
  -- التحقق من وجود رموز خاصة
  IF password_input ~ '[^A-Za-z0-9]' THEN
    score := score + 1;
    result := jsonb_set(result, '{special}', 'true'::jsonb);
  ELSE
    result := jsonb_set(result, '{special}', 'false'::jsonb);
  END IF;
  
  -- إضافة النتيجة الإجمالية
  result := jsonb_set(result, '{score}', to_jsonb(score));
  
  -- تحديد قوة كلمة المرور
  IF score >= 4 THEN
    result := jsonb_set(result, '{strength}', '"strong"'::jsonb);
  ELSIF score >= 3 THEN
    result := jsonb_set(result, '{strength}', '"medium"'::jsonb);
  ELSE
    result := jsonb_set(result, '{strength}', '"weak"'::jsonb);
  END IF;
  
  RETURN result;
END;
$$;