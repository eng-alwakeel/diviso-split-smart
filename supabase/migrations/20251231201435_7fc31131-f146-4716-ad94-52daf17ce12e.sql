-- تحديث دالة handle_new_user لتمنح النقاط الترحيبية تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- إنشاء profile جديد
  INSERT INTO public.profiles (
    id, 
    display_name, 
    name, 
    phone
  ) VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'display_name'),
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    updated_at = now();
  
  -- منح النقاط الترحيبية (50 نقطة)
  PERFORM public.grant_welcome_credits(NEW.id);
  
  RETURN NEW;
END;
$$;

-- منح نقاط ترحيبية لجميع المستخدمين الحاليين الذين لم يحصلوا عليها
INSERT INTO public.usage_credits (user_id, amount, source, description_ar, expires_at)
SELECT 
  p.id,
  50,
  'welcome',
  'نقاط ترحيبية',
  now() + interval '30 days'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.usage_credits uc 
  WHERE uc.user_id = p.id AND uc.source = 'welcome'
);