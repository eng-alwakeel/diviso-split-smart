-- تفعيل صلاحيات الإدارة للمستخدم Adel alwakeel
UPDATE public.profiles 
SET is_admin = true, updated_at = now()
WHERE id = 'c5b6b76f-f038-4176-b8ad-8a7dd37e2e24';