-- إضافة حالة 'expired' لـ enum referral_status
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'expired';

-- إنشاء دالة لتحديث الإحالات المنتهية الصلاحية تلقائياً
CREATE OR REPLACE FUNCTION public.update_expired_referrals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- تحديث الإحالات المنتهية الصلاحية
  UPDATE public.referrals 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND created_at < now() - interval '30 days';
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- تسجيل العملية في جدول الأمان إذا كان موجوداً
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') THEN
    PERFORM public.log_security_event(
      'referrals_expired_updated',
      'referrals',
      jsonb_build_object('expired_count', v_count)
    );
  END IF;
  
  RETURN v_count;
END;
$$;

-- إنشاء دالة لتنظيف الإحالات القديمة والمنتهية
CREATE OR REPLACE FUNCTION public.cleanup_old_referrals(p_months_old INTEGER DEFAULT 6)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- حذف الإحالات المنتهية والقديمة جداً
  DELETE FROM public.referrals 
  WHERE status = 'expired' 
    AND created_at <= now() - (p_months_old || ' months')::interval;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- تسجيل العملية
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') THEN
    PERFORM public.log_security_event(
      'old_referrals_cleaned',
      'referrals',
      jsonb_build_object('cleaned_count', v_count, 'months_threshold', p_months_old)
    );
  END IF;
  
  RETURN v_count;
END;
$$;

-- إنشاء trigger لتحديث الإحالات المنتهية تلقائياً عند الإدراج
CREATE OR REPLACE FUNCTION public.check_referral_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- تحقق من انتهاء صلاحية الإحالة الجديدة
  IF NEW.status = 'pending' AND NEW.created_at < now() - interval '30 days' THEN
    NEW.status := 'expired';
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger على جدول referrals
DROP TRIGGER IF EXISTS trg_check_referral_expiry ON public.referrals;
CREATE TRIGGER trg_check_referral_expiry
  BEFORE INSERT OR UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_expiry();

-- إنشاء دالة للحصول على إحصائيات الإحالة المحسنة
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS TABLE(
  total_referrals INTEGER,
  successful_referrals INTEGER,
  pending_referrals INTEGER,
  expired_referrals INTEGER,
  success_rate NUMERIC,
  total_rewards_days INTEGER,
  available_rewards_days INTEGER,
  last_referral_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH referral_counts AS (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'joined') AS successful,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'expired') AS expired,
      MAX(created_at) AS last_referral
    FROM public.referrals 
    WHERE inviter_id = p_user_id
  ),
  reward_counts AS (
    SELECT 
      COALESCE(SUM(rr.days_earned), 0) AS total_days,
      COALESCE(SUM(rr.days_earned) FILTER (WHERE NOT rr.applied_to_subscription), 0) AS available_days
    FROM public.referral_rewards rr
    WHERE rr.user_id = p_user_id
  )
  SELECT 
    rc.total::INTEGER,
    rc.successful::INTEGER,
    rc.pending::INTEGER,
    rc.expired::INTEGER,
    CASE 
      WHEN rc.total > 0 THEN ROUND((rc.successful::NUMERIC / rc.total * 100), 2)
      ELSE 0
    END,
    rw.total_days::INTEGER,
    rw.available_days::INTEGER,
    rc.last_referral
  FROM referral_counts rc, reward_counts rw;
END;
$$;