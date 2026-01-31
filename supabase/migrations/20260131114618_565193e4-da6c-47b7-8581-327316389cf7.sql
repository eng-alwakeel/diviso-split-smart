-- ============================================
-- برنامج المستخدمين المؤسسين - أول 1000 مستخدم
-- ============================================

-- 1. إضافة أعمدة جديدة لجدول profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_number INTEGER UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_founding_user BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- 2. إنشاء sequence للأرقام التسلسلية
CREATE SEQUENCE IF NOT EXISTS user_number_seq START WITH 1;

-- 3. منح أرقام تسلسلية للمستخدمين الحاليين بترتيب التسجيل
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM profiles
  WHERE user_number IS NULL
)
UPDATE profiles SET 
  user_number = numbered_users.rn,
  is_founding_user = (numbered_users.rn <= 1000)
FROM numbered_users
WHERE profiles.id = numbered_users.id;

-- 4. تحديث الـ sequence للبدء من الرقم التالي
SELECT setval('user_number_seq', COALESCE((SELECT MAX(user_number) FROM profiles), 0) + 1);

-- 5. تحديث دالة منح النقاط الترحيبية (تدعم المؤسسين)
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(
  p_user_id UUID,
  p_is_founding BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_welcome_credits INTEGER;
  v_validity_days INTEGER;
  v_existing_count INTEGER;
BEGIN
  -- التحقق من عدم استلام نقاط ترحيبية سابقة
  SELECT COUNT(*) INTO v_existing_count
  FROM usage_credits
  WHERE user_id = p_user_id AND source IN ('welcome', 'founding_welcome');
  
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_received');
  END IF;
  
  -- 100 نقطة للمؤسسين، 50 للعاديين
  IF p_is_founding THEN
    v_welcome_credits := 100;
    v_validity_days := 30; -- صلاحية أطول للمؤسسين
  ELSE
    SELECT COALESCE((flag_value::text)::integer, 50) INTO v_welcome_credits
    FROM admin_feature_flags WHERE flag_name = 'welcome_credits';
    v_welcome_credits := COALESCE(v_welcome_credits, 50);
    
    SELECT COALESCE((flag_value::text)::integer, 7) INTO v_validity_days
    FROM admin_feature_flags WHERE flag_name = 'welcome_credits_validity_days';
    v_validity_days := COALESCE(v_validity_days, 7);
  END IF;
  
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    p_user_id, 
    v_welcome_credits, 
    CASE WHEN p_is_founding THEN 'founding_welcome' ELSE 'welcome' END,
    CASE WHEN p_is_founding THEN 'نقاط ترحيبية - مستخدم مؤسس' ELSE 'نقاط ترحيبية' END,
    now() + (v_validity_days || ' days')::interval
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'credits', v_welcome_credits,
    'validity_days', v_validity_days,
    'is_founding', p_is_founding
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. تحديث trigger إنشاء المستخدم
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_user_number INTEGER;
  v_is_founding BOOLEAN;
BEGIN
  -- الحصول على الرقم التسلسلي التالي
  SELECT nextval('user_number_seq') INTO v_user_number;
  
  -- تحديد إذا كان مؤسس (≤ 1000)
  v_is_founding := (v_user_number <= 1000);
  
  INSERT INTO public.profiles (
    id, display_name, name, phone, user_number, is_founding_user, last_active_at
  ) VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'display_name'),
    NEW.phone,
    v_user_number,
    v_is_founding,
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    user_number = COALESCE(profiles.user_number, EXCLUDED.user_number),
    is_founding_user = COALESCE(profiles.is_founding_user, EXCLUDED.is_founding_user),
    last_active_at = now();
  
  -- منح النقاط الترحيبية (100 للمؤسسين، 50 للعاديين)
  PERFORM public.grant_welcome_credits(NEW.id, v_is_founding);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. دالة تتبع النشاط
CREATE OR REPLACE FUNCTION public.update_user_activity(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET last_active_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.update_user_activity TO authenticated;

-- 8. إضافة feature flags للبرنامج
INSERT INTO admin_feature_flags (flag_name, flag_value, description, description_ar)
VALUES 
  ('founding_users_limit', '1000', 'Maximum founding users', 'الحد الأقصى للمستخدمين المؤسسين'),
  ('founding_welcome_credits', '100', 'Welcome credits for founding users', 'نقاط الترحيب للمستخدمين المؤسسين'),
  ('founding_monthly_credits', '50', 'Monthly credits for active founding users', 'النقاط الشهرية للمستخدمين المؤسسين النشطين')
ON CONFLICT (flag_name) DO NOTHING;