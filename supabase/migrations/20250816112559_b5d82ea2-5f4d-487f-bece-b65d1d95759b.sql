-- إضافة حقل رقم الموبايل إلى جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN phone text;

-- إضافة فهرس فريد لرقم الموبايل للأداء والأمان
CREATE UNIQUE INDEX idx_profiles_phone ON public.profiles(phone) 
WHERE phone IS NOT NULL;

-- تحديث trigger handle_new_user لدعم Phone Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
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
    name = COALESCE(profiles.name, EXCLUDED.name),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$;