-- Fix check_recommendation_limit function: change from STABLE to VOLATILE
-- STABLE functions cannot perform UPDATE operations, causing recommendation failures

CREATE OR REPLACE FUNCTION public.check_recommendation_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
BEGIN
  SELECT enabled, max_per_day, notifications_today, last_notification_at
  INTO v_settings
  FROM public.user_recommendation_settings
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  IF NOT v_settings.enabled THEN
    RETURN false;
  END IF;
  
  -- Reset daily counter if last notification was on a previous day
  IF v_settings.last_notification_at IS NULL OR 
     v_settings.last_notification_at::date < CURRENT_DATE THEN
    UPDATE public.user_recommendation_settings
    SET notifications_today = 0
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  
  RETURN v_settings.notifications_today < v_settings.max_per_day;
END;
$$;