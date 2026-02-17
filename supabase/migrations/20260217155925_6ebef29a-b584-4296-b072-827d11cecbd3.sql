
-- Insert the new_onboarding_v2 feature flag
INSERT INTO public.admin_feature_flags (flag_name, flag_value, description, description_ar)
VALUES (
  'new_onboarding_v2',
  '{"enabled": true}'::jsonb,
  'New multi-step onboarding flow for users with zero groups',
  'تجربة الإعداد الجديدة متعددة الخطوات للمستخدمين بدون مجموعات'
)
ON CONFLICT (flag_name) DO UPDATE SET flag_value = '{"enabled": true}'::jsonb;
