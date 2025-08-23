-- المرحلة الثالثة والرابعة والخامسة: إضافة جداول وميزات متقدمة

-- إضافة جدول لمستويات الإحالة (المكافآت المتدرجة)
CREATE TABLE IF NOT EXISTS public.referral_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  min_referrals INTEGER NOT NULL,
  max_referrals INTEGER,
  days_reward INTEGER NOT NULL DEFAULT 7,
  bonus_multiplier NUMERIC DEFAULT 1.0,
  tier_color TEXT DEFAULT '#10b981',
  tier_icon TEXT DEFAULT '🏆',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إدراج المستويات الافتراضية
INSERT INTO public.referral_tiers (tier_name, min_referrals, max_referrals, days_reward, bonus_multiplier, tier_color, tier_icon) VALUES
('المبتدئ', 0, 4, 7, 1.0, '#10b981', '🌱'),
('المتقدم', 5, 14, 10, 1.2, '#3b82f6', '⭐'),
('الخبير', 15, 29, 15, 1.5, '#8b5cf6', '🚀'),
('البطل', 30, 49, 20, 2.0, '#f59e0b', '👑'),
('الأسطورة', 50, NULL, 30, 3.0, '#ef4444', '🔥')
ON CONFLICT DO NOTHING;

-- إضافة جدول لتتبع مصادر الإحالة
CREATE TABLE IF NOT EXISTS public.referral_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'sms', -- sms, whatsapp, email, link, qr_code
  source_details JSONB DEFAULT '{}',
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة جدول للإحالة الجماعية
CREATE TABLE IF NOT EXISTS public.bulk_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  batch_name TEXT,
  total_invites INTEGER DEFAULT 0,
  successful_invites INTEGER DEFAULT 0,
  failed_invites INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- إضافة جدول للحماية من spam
CREATE TABLE IF NOT EXISTS public.referral_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة جدول لإحصائيات الإحالة
CREATE TABLE IF NOT EXISTS public.referral_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  invites_sent INTEGER DEFAULT 0,
  invites_accepted INTEGER DEFAULT 0,
  rewards_earned INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- إضافة عمود لتتبع مصدر الإحالة في جدول referrals
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS referral_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS tier_at_time TEXT,
ADD COLUMN IF NOT EXISTS original_reward_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS bonus_applied BOOLEAN DEFAULT FALSE;

-- دالة للحصول على مستوى المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_user_referral_tier(p_user_id UUID)
RETURNS TABLE(
  tier_name TEXT,
  tier_icon TEXT,
  tier_color TEXT,
  current_referrals INTEGER,
  next_tier_name TEXT,
  referrals_needed INTEGER,
  total_reward_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_successful_referrals INTEGER;
  v_current_tier RECORD;
  v_next_tier RECORD;
BEGIN
  -- حساب عدد الإحالات الناجحة
  SELECT COUNT(*) INTO v_successful_referrals
  FROM public.referrals 
  WHERE inviter_id = p_user_id AND status = 'joined';
  
  -- الحصول على المستوى الحالي
  SELECT * INTO v_current_tier
  FROM public.referral_tiers
  WHERE min_referrals <= v_successful_referrals 
    AND (max_referrals IS NULL OR v_successful_referrals <= max_referrals)
  ORDER BY min_referrals DESC
  LIMIT 1;
  
  -- الحصول على المستوى التالي
  SELECT * INTO v_next_tier
  FROM public.referral_tiers
  WHERE min_referrals > v_successful_referrals
  ORDER BY min_referrals ASC
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    v_current_tier.tier_name,
    v_current_tier.tier_icon,
    v_current_tier.tier_color,
    v_successful_referrals,
    v_next_tier.tier_name,
    CASE 
      WHEN v_next_tier.min_referrals IS NOT NULL 
      THEN v_next_tier.min_referrals - v_successful_referrals
      ELSE 0
    END,
    COALESCE((
      SELECT SUM(rr.days_earned)
      FROM public.referral_rewards rr
      WHERE rr.user_id = p_user_id
    ), 0)::INTEGER;
END;
$$;

-- دالة للتحقق من spam والحماية
CREATE OR REPLACE FUNCTION public.check_referral_spam_protection(p_user_id UUID, p_phone TEXT)
RETURNS TABLE(
  is_allowed BOOLEAN,
  reason TEXT,
  retry_after INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_security RECORD;
  v_daily_count INTEGER;
  v_hourly_count INTEGER;
BEGIN
  -- التحقق من الحظر النشط
  SELECT * INTO v_security
  FROM public.referral_security
  WHERE user_id = p_user_id AND phone_number = p_phone
    AND blocked_until > now()
  ORDER BY last_attempt DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      FALSE,
      'تم حظر هذا الرقم مؤقتاً بسبب محاولات متكررة',
      EXTRACT(EPOCH FROM (v_security.blocked_until - now()))::INTEGER;
    RETURN;
  END IF;
  
  -- التحقق من الحد اليومي (10 إحالات يومياً)
  SELECT COUNT(*) INTO v_daily_count
  FROM public.referrals
  WHERE inviter_id = p_user_id 
    AND created_at >= CURRENT_DATE;
  
  IF v_daily_count >= 10 THEN
    RETURN QUERY SELECT 
      FALSE,
      'تم الوصول للحد الأقصى اليومي (10 إحالات)',
      86400; -- 24 hours
    RETURN;
  END IF;
  
  -- التحقق من الحد الساعي (3 إحالات بالساعة)
  SELECT COUNT(*) INTO v_hourly_count
  FROM public.referrals
  WHERE inviter_id = p_user_id 
    AND created_at >= now() - interval '1 hour';
  
  IF v_hourly_count >= 3 THEN
    RETURN QUERY SELECT 
      FALSE,
      'تم الوصول للحد الأقصى الساعي (3 إحالات)',
      3600; -- 1 hour
    RETURN;
  END IF;
  
  -- السماح بالإحالة
  RETURN QUERY SELECT TRUE, 'مسموح', 0;
END;
$$;

-- دالة لتسجيل محاولة إحالة مشبوهة
CREATE OR REPLACE FUNCTION public.log_suspicious_referral(
  p_user_id UUID,
  p_phone TEXT,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.referral_security (user_id, phone_number, reason)
  VALUES (p_user_id, p_phone, p_reason)
  ON CONFLICT (user_id, phone_number) DO UPDATE SET
    attempt_count = referral_security.attempt_count + 1,
    last_attempt = now(),
    reason = EXCLUDED.reason,
    blocked_until = CASE 
      WHEN referral_security.attempt_count >= 5 
      THEN now() + interval '24 hours'
      WHEN referral_security.attempt_count >= 3 
      THEN now() + interval '1 hour'
      ELSE NULL
    END;
END;
$$;

-- دالة للتحليلات اليومية
CREATE OR REPLACE FUNCTION public.update_daily_referral_analytics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT inviter_id as user_id FROM public.referrals 
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
  LOOP
    INSERT INTO public.referral_analytics (
      user_id, 
      date, 
      invites_sent, 
      invites_accepted, 
      conversion_rate
    )
    SELECT 
      user_record.user_id,
      CURRENT_DATE - INTERVAL '1 day',
      COUNT(*),
      COUNT(*) FILTER (WHERE status = 'joined'),
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'joined'))::NUMERIC / COUNT(*) * 100
        ELSE 0 
      END
    FROM public.referrals 
    WHERE inviter_id = user_record.user_id 
      AND created_at::date = CURRENT_DATE - INTERVAL '1 day'
    ON CONFLICT (user_id, date) DO UPDATE SET
      invites_sent = EXCLUDED.invites_sent,
      invites_accepted = EXCLUDED.invites_accepted,
      conversion_rate = EXCLUDED.conversion_rate,
      updated_at = now();
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- إنشاء RLS policies للجداول الجديدة
ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_analytics ENABLE ROW LEVEL SECURITY;

-- Policies للجداول الجديدة
CREATE POLICY "Anyone can read referral tiers" ON public.referral_tiers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read their referral sources" ON public.referral_sources 
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.referrals WHERE id = referral_sources.referral_id AND inviter_id = auth.uid())
  );

CREATE POLICY "Users can manage their bulk referrals" ON public.bulk_referrals 
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their security logs" ON public.referral_security 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can read their analytics" ON public.referral_analytics 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_referral_sources_referral_id ON public.referral_sources(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_security_user_phone ON public.referral_security(user_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_user_date ON public.referral_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_referrals_status_created ON public.referrals(status, created_at);

-- إضافة trigger لتحديث updated_at
CREATE TRIGGER set_updated_at_referral_tiers 
  BEFORE UPDATE ON public.referral_tiers 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_referral_analytics 
  BEFORE UPDATE ON public.referral_analytics 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();