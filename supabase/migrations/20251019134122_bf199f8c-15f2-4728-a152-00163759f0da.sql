-- Update handle_new_user trigger to save privacy policy acceptance date
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
    phone,
    privacy_policy_accepted_at
  ) VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'display_name'),
    NEW.phone,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'privacy_policy_accepted' = 'true' 
      THEN (NEW.raw_user_meta_data ->> 'privacy_policy_accepted_at')::timestamptz
      ELSE NULL 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    name = COALESCE(profiles.name, EXCLUDED.name),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    privacy_policy_accepted_at = COALESCE(profiles.privacy_policy_accepted_at, EXCLUDED.privacy_policy_accepted_at),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Add index for better performance on privacy policy queries
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_accepted 
ON public.profiles(privacy_policy_accepted_at) 
WHERE privacy_policy_accepted_at IS NOT NULL;