-- Phase 1: Recommendation Engine Database Tables

-- جدول التوصيات الرئيسي
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'food', 'accommodation', 'activity'
  source VARCHAR(50) NOT NULL DEFAULT 'google_places', -- 'google_places', 'travelpayouts'
  place_id VARCHAR(255), -- Google Place ID
  external_id VARCHAR(255), -- Travelpayouts ID
  name TEXT NOT NULL,
  name_ar TEXT,
  category VARCHAR(100),
  rating DECIMAL(2,1),
  price_range VARCHAR(20), -- 'low', 'medium', 'high'
  estimated_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'SAR',
  location JSONB DEFAULT '{}', -- {city, country, lat, lng}
  relevance_reason TEXT,
  relevance_reason_ar TEXT,
  affiliate_url TEXT,
  is_partner BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'converted'
  context JSONB DEFAULT '{}', -- {trigger, time_slot, group_size, etc.}
  created_at TIMESTAMPTZ DEFAULT now(),
  shown_at TIMESTAMPTZ,
  interacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- جدول تتبع أداء التوصيات
CREATE TABLE public.recommendation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'shown', 'clicked', 'dismissed', 'expense_added', 'affiliate_clicked'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول إعدادات التوصيات للمستخدم
CREATE TABLE public.user_recommendation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT true,
  max_per_day INTEGER DEFAULT 3,
  preferred_categories TEXT[],
  blocked_categories TEXT[],
  last_notification_at TIMESTAMPTZ,
  notifications_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- جدول كاش Google Places
CREATE TABLE public.places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  city VARCHAR(100),
  category VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء Indexes للأداء
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_group_id ON public.recommendations(group_id);
CREATE INDEX idx_recommendations_status ON public.recommendations(status);
CREATE INDEX idx_recommendations_created_at ON public.recommendations(created_at DESC);
CREATE INDEX idx_recommendation_analytics_recommendation_id ON public.recommendation_analytics(recommendation_id);
CREATE INDEX idx_recommendation_analytics_event_type ON public.recommendation_analytics(event_type);
CREATE INDEX idx_places_cache_city ON public.places_cache(city);
CREATE INDEX idx_places_cache_expires ON public.places_cache(expires_at);

-- تفعيل RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recommendation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places_cache ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للتوصيات
CREATE POLICY "Users can view their own recommendations"
  ON public.recommendations FOR SELECT
  USING (user_id = auth.uid() OR (group_id IS NOT NULL AND is_group_member(group_id)));

CREATE POLICY "Users can update their own recommendations"
  ON public.recommendations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert recommendations"
  ON public.recommendations FOR INSERT
  WITH CHECK (true);

-- سياسات RLS لتحليلات التوصيات
CREATE POLICY "Users can view their own analytics"
  ON public.recommendation_analytics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own analytics"
  ON public.recommendation_analytics FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- سياسات RLS لإعدادات التوصيات
CREATE POLICY "Users can manage their own settings"
  ON public.user_recommendation_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- سياسات RLS للكاش (قراءة فقط للمستخدمين المسجلين)
CREATE POLICY "Authenticated users can read cache"
  ON public.places_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger لتحديث updated_at
CREATE TRIGGER update_user_recommendation_settings_updated_at
  BEFORE UPDATE ON public.user_recommendation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function لتنظيف الكاش المنتهي
CREATE OR REPLACE FUNCTION public.cleanup_expired_places_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.places_cache WHERE expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function للتحقق من حد التوصيات اليومي
CREATE OR REPLACE FUNCTION public.check_recommendation_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
  v_today_count INTEGER;
BEGIN
  -- جلب إعدادات المستخدم
  SELECT enabled, max_per_day, notifications_today, last_notification_at
  INTO v_settings
  FROM public.user_recommendation_settings
  WHERE user_id = p_user_id;
  
  -- إذا لم توجد إعدادات، السماح بالتوصيات
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- إذا كانت التوصيات معطلة
  IF NOT v_settings.enabled THEN
    RETURN false;
  END IF;
  
  -- إعادة تعيين العداد إذا كان يوم جديد
  IF v_settings.last_notification_at IS NULL OR 
     v_settings.last_notification_at::date < CURRENT_DATE THEN
    UPDATE public.user_recommendation_settings
    SET notifications_today = 0
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  
  -- التحقق من الحد اليومي
  RETURN v_settings.notifications_today < v_settings.max_per_day;
END;
$$;

-- Function لزيادة عداد التوصيات اليومية
CREATE OR REPLACE FUNCTION public.increment_recommendation_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_recommendation_settings (user_id, notifications_today, last_notification_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    notifications_today = CASE 
      WHEN user_recommendation_settings.last_notification_at::date < CURRENT_DATE THEN 1
      ELSE user_recommendation_settings.notifications_today + 1
    END,
    last_notification_at = now(),
    updated_at = now();
END;
$$;