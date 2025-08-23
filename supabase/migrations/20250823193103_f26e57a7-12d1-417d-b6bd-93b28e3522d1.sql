-- ترقية المستخدم الحالي إلى مدير عام
-- هذا سيتم تنفيذه للمستخدم الذي قام بتسجيل الدخول حالياً

UPDATE public.profiles 
SET is_admin = true, updated_at = now()
WHERE id = auth.uid();

-- إنشاء سجل أمان لهذا التغيير
INSERT INTO public.security_logs (user_id, action, table_name, details)
VALUES (
  auth.uid(),
  'admin_promotion',
  'profiles',
  jsonb_build_object('promoted_to_admin', true, 'promoted_at', now())
);