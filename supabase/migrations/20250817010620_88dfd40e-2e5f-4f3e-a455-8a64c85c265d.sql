-- المرحلة الأولى: إصلاح المشاكل الأمنية الحرجة

-- 1. تقليل مدة انتهاء صلاحية OTP إلى 10 دقائق
-- تعديل إعدادات المصادقة الافتراضية
UPDATE auth.config SET
  sms_otp_exp = 600,  -- 10 دقائق بدلاً من الافتراضي
  email_otp_exp = 600 -- 10 دقائق للبريد الإلكتروني أيضاً
WHERE true;

-- 2. إضافة فهرسة للبحث الأمني السريع
CREATE INDEX IF NOT EXISTS idx_security_logs_user_action ON security_logs(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_time ON security_logs(ip_address, created_at);

-- 3. تحسين سياسات RLS للبيانات المالية الحساسة
-- إضافة سياسة لحماية بيانات المدفوعات
CREATE POLICY "Restrict payment data access" 
ON expense_splits 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM expenses e 
    WHERE e.id = expense_splits.expense_id 
    AND is_group_member(e.group_id)
  )
);

-- 4. تحسين حماية بيانات الملف الشخصي
DROP POLICY IF EXISTS "Group members can view basic profile info" ON profiles;
CREATE POLICY "Limited profile visibility" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM group_members gm1 
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id 
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = profiles.id
  )
);

-- 5. إضافة حماية إضافية للبيانات المالية
CREATE POLICY "Restrict financial data in notifications" 
ON notifications 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() AND (
    type != 'financial_report' OR 
    created_at > NOW() - INTERVAL '30 days'
  )
);

-- 6. تحسين حماية رموز الدعوات
CREATE POLICY "Expire old invite tokens" 
ON group_join_tokens 
FOR SELECT 
TO authenticated 
USING (
  expires_at > NOW() AND 
  used_at IS NULL AND
  is_group_admin(group_id)
);

-- 7. إضافة تسجيل أمني لعمليات تسجيل الدخول المشبوهة
CREATE OR REPLACE FUNCTION log_suspicious_login()
RETURNS TRIGGER AS $$
BEGIN
  -- سجل محاولات تسجيل الدخول المتكررة من نفس IP
  IF NEW.action = 'login_failed' THEN
    INSERT INTO security_logs (user_id, action, ip_address, details)
    VALUES (
      NEW.user_id,
      'suspicious_login_attempt',
      NEW.ip_address,
      jsonb_build_object(
        'attempts_count', (
          SELECT COUNT(*) FROM security_logs 
          WHERE ip_address = NEW.ip_address 
          AND action = 'login_failed'
          AND created_at > NOW() - INTERVAL '1 hour'
        ),
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_suspicious_login
  AFTER INSERT ON security_logs
  FOR EACH ROW
  EXECUTE FUNCTION log_suspicious_login();