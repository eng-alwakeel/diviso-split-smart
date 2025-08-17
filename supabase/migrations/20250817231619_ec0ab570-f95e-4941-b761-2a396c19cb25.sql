-- Add fields to track unified trial system
ALTER TABLE public.user_subscriptions 
ADD COLUMN first_trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_trial_days_used INTEGER DEFAULT 0;

-- Update existing records to set first_trial_started_at for current trials
UPDATE public.user_subscriptions 
SET first_trial_started_at = started_at 
WHERE status = 'trialing' AND first_trial_started_at IS NULL;

-- Create function to calculate remaining trial days
CREATE OR REPLACE FUNCTION public.get_remaining_trial_days(p_user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription RECORD;
  v_total_days_used INTEGER := 0;
  v_max_trial_days INTEGER := 7;
BEGIN
  SELECT 
    first_trial_started_at,
    total_trial_days_used,
    status
  INTO v_subscription
  FROM public.user_subscriptions 
  WHERE user_id = p_user_id;
  
  -- If no subscription exists, user gets full trial
  IF NOT FOUND THEN
    RETURN v_max_trial_days;
  END IF;
  
  -- If never started a trial, user gets full trial
  IF v_subscription.first_trial_started_at IS NULL THEN
    RETURN v_max_trial_days;
  END IF;
  
  -- Calculate days used based on first trial start
  v_total_days_used := GREATEST(
    COALESCE(v_subscription.total_trial_days_used, 0),
    EXTRACT(DAY FROM (now() - v_subscription.first_trial_started_at))::INTEGER
  );
  
  -- Return remaining days (minimum 0)
  RETURN GREATEST(0, v_max_trial_days - v_total_days_used);
END;
$function$;