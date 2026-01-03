-- Insert default ad types with settings
INSERT INTO ad_types (type_key, name, name_ar, description, description_ar, is_enabled, settings)
VALUES 
  ('rewarded', 'Rewarded Video', 'فيديو مكافئ', 'Watch video ad to earn credits', 'شاهد إعلان فيديو واحصل على نقاط', true, '{"reward_uc": 1, "daily_cap": 5, "cooldown_seconds": 180, "validity_type": "immediate"}'::jsonb),
  ('sponsored', 'Sponsored Cards', 'بطاقات برعاية', 'Smart affiliate product recommendations', 'توصيات منتجات ذكية', true, '{"max_per_feed": 1, "cards_between_ads": 8, "label_text_ar": "إعلان ذكي", "label_text_en": "Smart Ad"}'::jsonb),
  ('native', 'Native Ads', 'إعلانات مدمجة', 'Native ads in feed (AdMob)', 'إعلانات مدمجة في الخلاصة', false, '{"frequency": 10, "min_cards_before_first": 5, "label_text_ar": "إعلان", "label_text_en": "Ad"}'::jsonb),
  ('banner', 'Banner Ads', 'إعلانات بانر', 'Static banner ads', 'إعلانات بانر ثابتة', false, '{"refresh_seconds": 60, "label_text_ar": "إعلان", "label_text_en": "Ad"}'::jsonb),
  ('interstitial', 'Interstitial', 'إعلان ملء الشاشة', 'Full screen interstitial ads', 'إعلانات ملء الشاشة', false, '{"min_interval_seconds": 300}'::jsonb),
  ('app_open', 'App Open', 'عند فتح التطبيق', 'Ads shown on app open', 'إعلانات عند فتح التطبيق', false, '{"max_per_day": 1}'::jsonb)
ON CONFLICT (type_key) DO UPDATE SET
  settings = EXCLUDED.settings,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

-- Insert default ad placements
INSERT INTO ad_placements (placement_key, name, name_ar, allowed_ad_types, is_enabled, max_impressions_per_user_day, min_interval_seconds)
VALUES 
  ('paywall_rewarded', 'Paywall Rewarded', 'صفحة الدفع - مكافئ', ARRAY['rewarded'], true, 5, 180),
  ('recommendations_feed', 'Recommendations Feed', 'خلاصة التوصيات', ARRAY['sponsored', 'native'], true, 10, 60),
  ('recommendations_native', 'Recommendations Native', 'التوصيات المدمجة', ARRAY['native'], false, 5, 120),
  ('settings_banner', 'Settings Banner', 'بانر الإعدادات', ARRAY['banner'], false, 3, 300),
  ('profile_banner', 'Profile Banner', 'بانر الملف الشخصي', ARRAY['banner'], false, 3, 300),
  ('dashboard_sidebar', 'Dashboard Sidebar', 'الشريط الجانبي', ARRAY['sponsored', 'native'], true, 10, 60),
  ('dashboard_native', 'Dashboard Native', 'لوحة القيادة المدمجة', ARRAY['native'], false, 5, 120),
  ('reports_banner', 'Reports Banner', 'بانر التقارير', ARRAY['banner'], false, 3, 300),
  ('group_sponsored', 'Group Sponsored', 'توصيات المجموعة', ARRAY['sponsored'], true, 5, 120)
ON CONFLICT (placement_key) DO UPDATE SET
  allowed_ad_types = EXCLUDED.allowed_ad_types,
  is_enabled = EXCLUDED.is_enabled,
  max_impressions_per_user_day = EXCLUDED.max_impressions_per_user_day,
  min_interval_seconds = EXCLUDED.min_interval_seconds,
  updated_at = now();