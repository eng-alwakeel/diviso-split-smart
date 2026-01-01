-- Create analytics_events table for tracking user actions
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(event_category);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_date ON public.analytics_events(user_id, created_at);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert own events" ON public.analytics_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Admins can read all events
CREATE POLICY "Admins can read all events" ON public.analytics_events
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Function: Get user activity metrics (DAU, WAU, MAU, Stickiness)
CREATE OR REPLACE FUNCTION public.get_user_activity_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  dau BIGINT,
  wau BIGINT,
  mau BIGINT,
  stickiness DECIMAL,
  new_users_today BIGINT,
  new_users_week BIGINT,
  new_users_month BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- DAU: unique users active today
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at >= p_date AND created_at < p_date + INTERVAL '1 day')::BIGINT as dau,
    
    -- WAU: unique users active this week
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at >= p_date - INTERVAL '6 days' AND created_at < p_date + INTERVAL '1 day')::BIGINT as wau,
    
    -- MAU: unique users active this month
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at >= p_date - INTERVAL '29 days' AND created_at < p_date + INTERVAL '1 day')::BIGINT as mau,
    
    -- Stickiness: DAU/MAU ratio
    CASE 
      WHEN (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
            WHERE created_at >= p_date - INTERVAL '29 days') > 0
      THEN ROUND(
        (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
         WHERE created_at >= p_date AND created_at < p_date + INTERVAL '1 day')::DECIMAL /
        NULLIF((SELECT COUNT(DISTINCT user_id) FROM analytics_events 
                WHERE created_at >= p_date - INTERVAL '29 days'), 0) * 100, 2
      )
      ELSE 0
    END as stickiness,
    
    -- New users today
    (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = p_date)::BIGINT as new_users_today,
    
    -- New users this week
    (SELECT COUNT(*) FROM profiles 
     WHERE created_at >= p_date - INTERVAL '6 days')::BIGINT as new_users_week,
    
    -- New users this month
    (SELECT COUNT(*) FROM profiles 
     WHERE created_at >= p_date - INTERVAL '29 days')::BIGINT as new_users_month;
END;
$$;

-- Function: Get retention cohorts (D1, D7, D30)
CREATE OR REPLACE FUNCTION public.get_retention_cohorts(p_weeks INTEGER DEFAULT 8)
RETURNS TABLE (
  cohort_date DATE,
  cohort_size BIGINT,
  d1_retained BIGINT,
  d7_retained BIGINT,
  d30_retained BIGINT,
  d1_rate DECIMAL,
  d7_rate DECIMAL,
  d30_rate DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT 
      DATE(p.created_at) as signup_date,
      p.id as user_id
    FROM profiles p
    WHERE p.created_at >= CURRENT_DATE - (p_weeks * 7)
  ),
  retention AS (
    SELECT 
      c.signup_date,
      c.user_id,
      EXISTS (
        SELECT 1 FROM analytics_events e 
        WHERE e.user_id = c.user_id 
        AND DATE(e.created_at) = c.signup_date + 1
      ) as retained_d1,
      EXISTS (
        SELECT 1 FROM analytics_events e 
        WHERE e.user_id = c.user_id 
        AND DATE(e.created_at) = c.signup_date + 7
      ) as retained_d7,
      EXISTS (
        SELECT 1 FROM analytics_events e 
        WHERE e.user_id = c.user_id 
        AND DATE(e.created_at) = c.signup_date + 30
      ) as retained_d30
    FROM cohorts c
  )
  SELECT 
    r.signup_date as cohort_date,
    COUNT(*)::BIGINT as cohort_size,
    COUNT(*) FILTER (WHERE r.retained_d1)::BIGINT as d1_retained,
    COUNT(*) FILTER (WHERE r.retained_d7)::BIGINT as d7_retained,
    COUNT(*) FILTER (WHERE r.retained_d30)::BIGINT as d30_retained,
    ROUND(COUNT(*) FILTER (WHERE r.retained_d1)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as d1_rate,
    ROUND(COUNT(*) FILTER (WHERE r.retained_d7)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as d7_rate,
    ROUND(COUNT(*) FILTER (WHERE r.retained_d30)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as d30_rate
  FROM retention r
  GROUP BY r.signup_date
  ORDER BY r.signup_date DESC;
END;
$$;

-- Function: Get credits economy health
CREATE OR REPLACE FUNCTION public.get_credits_economy_health()
RETURNS TABLE (
  total_earned BIGINT,
  total_consumed BIGINT,
  total_expired BIGINT,
  total_purchased BIGINT,
  burn_rate DECIMAL,
  expiry_rate DECIMAL,
  earned_vs_purchased_ratio DECIMAL,
  paywall_hit_count BIGINT,
  paywall_conversion_rate DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total_granted BIGINT;
  v_total_consumed BIGINT;
  v_total_expired BIGINT;
  v_total_purchased BIGINT;
  v_paywall_views BIGINT;
  v_paywall_converts BIGINT;
BEGIN
  -- Get total credits granted (from usage_credits)
  SELECT COALESCE(SUM(credits_amount), 0)::BIGINT INTO v_total_granted
  FROM usage_credits WHERE source IN ('daily_bonus', 'referral', 'achievement', 'onboarding');
  
  -- Get total credits purchased
  SELECT COALESCE(SUM(credits_amount), 0)::BIGINT INTO v_total_purchased
  FROM usage_credits WHERE source IN ('purchase', 'subscription');
  
  -- Get total credits consumed
  SELECT COALESCE(SUM(amount_consumed), 0)::BIGINT INTO v_total_consumed
  FROM credit_consumption_log;
  
  -- Get total credits expired
  SELECT COALESCE(SUM(credits_amount), 0)::BIGINT INTO v_total_expired
  FROM usage_credits WHERE expires_at < NOW() AND credits_amount > 0;
  
  -- Get paywall views
  SELECT COUNT(*)::BIGINT INTO v_paywall_views
  FROM analytics_events WHERE event_name = 'paywall_viewed';
  
  -- Get paywall conversions (subscription or purchase after paywall)
  SELECT COUNT(DISTINCT user_id)::BIGINT INTO v_paywall_converts
  FROM analytics_events 
  WHERE event_name IN ('subscription_started', 'credits_pack_purchased')
  AND user_id IN (SELECT DISTINCT user_id FROM analytics_events WHERE event_name = 'paywall_viewed');
  
  RETURN QUERY SELECT
    v_total_granted as total_earned,
    v_total_consumed as total_consumed,
    v_total_expired as total_expired,
    v_total_purchased as total_purchased,
    CASE WHEN v_total_granted + v_total_purchased > 0 
      THEN ROUND(v_total_consumed::DECIMAL / (v_total_granted + v_total_purchased) * 100, 2)
      ELSE 0 
    END as burn_rate,
    CASE WHEN v_total_granted + v_total_purchased > 0 
      THEN ROUND(v_total_expired::DECIMAL / (v_total_granted + v_total_purchased) * 100, 2)
      ELSE 0 
    END as expiry_rate,
    CASE WHEN v_total_purchased > 0 
      THEN ROUND(v_total_granted::DECIMAL / v_total_purchased, 2)
      ELSE v_total_granted::DECIMAL 
    END as earned_vs_purchased_ratio,
    v_paywall_views as paywall_hit_count,
    CASE WHEN v_paywall_views > 0 
      THEN ROUND(v_paywall_converts::DECIMAL / v_paywall_views * 100, 2)
      ELSE 0 
    END as paywall_conversion_rate;
END;
$$;

-- Function: Get revenue metrics
CREATE OR REPLACE FUNCTION public.get_revenue_metrics(p_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE)
RETURNS TABLE (
  total_monthly_revenue DECIMAL,
  subscription_revenue DECIMAL,
  credits_revenue DECIMAL,
  subscriber_count BIGINT,
  new_subscribers BIGINT,
  churned_subscribers BIGINT,
  churn_rate DECIMAL,
  arppu DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sub_revenue DECIMAL;
  v_credits_revenue DECIMAL;
  v_subscribers BIGINT;
  v_new_subs BIGINT;
  v_churned BIGINT;
  v_paying_users BIGINT;
BEGIN
  -- Subscription revenue (estimated from active subscriptions)
  SELECT COALESCE(COUNT(*) * 29.99, 0)::DECIMAL INTO v_sub_revenue -- Assuming avg subscription price
  FROM user_subscriptions 
  WHERE status = 'active' 
  AND created_at >= p_month;
  
  -- Credits purchase revenue
  SELECT COALESCE(SUM(price_paid), 0)::DECIMAL INTO v_credits_revenue
  FROM credit_purchases 
  WHERE created_at >= p_month 
  AND status = 'completed';
  
  -- Active subscribers
  SELECT COUNT(*)::BIGINT INTO v_subscribers
  FROM user_subscriptions WHERE status = 'active';
  
  -- New subscribers this month
  SELECT COUNT(*)::BIGINT INTO v_new_subs
  FROM user_subscriptions 
  WHERE created_at >= p_month AND status = 'active';
  
  -- Churned subscribers (canceled this month)
  SELECT COUNT(*)::BIGINT INTO v_churned
  FROM user_subscriptions 
  WHERE expires_at >= p_month 
  AND expires_at < p_month + INTERVAL '1 month'
  AND status IN ('expired', 'canceled');
  
  -- Paying users (subscribers + credit purchasers)
  SELECT COUNT(DISTINCT user_id)::BIGINT INTO v_paying_users
  FROM (
    SELECT user_id FROM user_subscriptions WHERE status = 'active'
    UNION
    SELECT user_id FROM credit_purchases WHERE status = 'completed' AND created_at >= p_month
  ) paying;
  
  RETURN QUERY SELECT
    (v_sub_revenue + v_credits_revenue) as total_monthly_revenue,
    v_sub_revenue as subscription_revenue,
    v_credits_revenue as credits_revenue,
    v_subscribers as subscriber_count,
    v_new_subs as new_subscribers,
    v_churned as churned_subscribers,
    CASE WHEN v_subscribers > 0 
      THEN ROUND(v_churned::DECIMAL / v_subscribers * 100, 2)
      ELSE 0 
    END as churn_rate,
    CASE WHEN v_paying_users > 0 
      THEN ROUND((v_sub_revenue + v_credits_revenue) / v_paying_users, 2)
      ELSE 0 
    END as arppu;
END;
$$;

-- Function: Get growth loop metrics (referrals & invites)
CREATE OR REPLACE FUNCTION public.get_growth_loop_metrics()
RETURNS TABLE (
  total_invites_sent BIGINT,
  invites_this_week BIGINT,
  invites_accepted BIGINT,
  invite_conversion_rate DECIMAL,
  referral_signups BIGINT,
  referral_signup_rate DECIMAL,
  k_factor DECIMAL,
  active_referrers BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total_invites BIGINT;
  v_week_invites BIGINT;
  v_accepted BIGINT;
  v_referral_signups BIGINT;
  v_total_users BIGINT;
  v_active_referrers BIGINT;
BEGIN
  -- Total invites sent
  SELECT COUNT(*)::BIGINT INTO v_total_invites FROM invites;
  
  -- Invites this week
  SELECT COUNT(*)::BIGINT INTO v_week_invites 
  FROM invites WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Accepted invites
  SELECT COUNT(*)::BIGINT INTO v_accepted 
  FROM invites WHERE status = 'accepted';
  
  -- Referral signups (from referrals table)
  SELECT COUNT(*)::BIGINT INTO v_referral_signups
  FROM referrals WHERE status = 'completed';
  
  -- Total users
  SELECT COUNT(*)::BIGINT INTO v_total_users FROM profiles;
  
  -- Active referrers (users who made at least one successful referral)
  SELECT COUNT(DISTINCT inviter_id)::BIGINT INTO v_active_referrers
  FROM referrals WHERE status = 'completed';
  
  RETURN QUERY SELECT
    v_total_invites as total_invites_sent,
    v_week_invites as invites_this_week,
    v_accepted as invites_accepted,
    CASE WHEN v_total_invites > 0 
      THEN ROUND(v_accepted::DECIMAL / v_total_invites * 100, 2)
      ELSE 0 
    END as invite_conversion_rate,
    v_referral_signups as referral_signups,
    CASE WHEN v_total_users > 0 
      THEN ROUND(v_referral_signups::DECIMAL / v_total_users * 100, 2)
      ELSE 0 
    END as referral_signup_rate,
    CASE WHEN v_active_referrers > 0 
      THEN ROUND(v_referral_signups::DECIMAL / v_active_referrers, 2)
      ELSE 0 
    END as k_factor,
    v_active_referrers as active_referrers;
END;
$$;

-- Function: Get funnel metrics
CREATE OR REPLACE FUNCTION public.get_funnel_metrics(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_signups BIGINT,
  activated_users BIGINT,
  activation_rate DECIMAL,
  seven_day_active BIGINT,
  retention_to_7d DECIMAL,
  converted_to_paid BIGINT,
  conversion_rate DECIMAL,
  avg_time_to_first_value INTERVAL
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_signups BIGINT;
  v_activated BIGINT;
  v_7d_active BIGINT;
  v_paid BIGINT;
  v_avg_time INTERVAL;
BEGIN
  -- Total signups in period
  SELECT COUNT(*)::BIGINT INTO v_signups
  FROM profiles WHERE created_at >= CURRENT_DATE - p_days;
  
  -- Activated users (created group or added expense within 48 hours of signup)
  SELECT COUNT(DISTINCT p.id)::BIGINT INTO v_activated
  FROM profiles p
  WHERE p.created_at >= CURRENT_DATE - p_days
  AND (
    EXISTS (SELECT 1 FROM groups g WHERE g.owner_id = p.id AND g.created_at <= p.created_at + INTERVAL '48 hours')
    OR EXISTS (SELECT 1 FROM expenses e WHERE e.created_by = p.id AND e.created_at <= p.created_at + INTERVAL '48 hours')
  );
  
  -- 7-day active (returned within 7 days after signup)
  SELECT COUNT(DISTINCT p.id)::BIGINT INTO v_7d_active
  FROM profiles p
  WHERE p.created_at >= CURRENT_DATE - p_days
  AND EXISTS (
    SELECT 1 FROM analytics_events e 
    WHERE e.user_id = p.id 
    AND e.created_at >= p.created_at + INTERVAL '7 days'
  );
  
  -- Converted to paid
  SELECT COUNT(DISTINCT p.id)::BIGINT INTO v_paid
  FROM profiles p
  WHERE p.created_at >= CURRENT_DATE - p_days
  AND (
    EXISTS (SELECT 1 FROM user_subscriptions s WHERE s.user_id = p.id AND s.status = 'active')
    OR EXISTS (SELECT 1 FROM credit_purchases c WHERE c.user_id = p.id AND c.status = 'completed')
  );
  
  -- Average time to first value
  SELECT AVG(first_action - signup)::INTERVAL INTO v_avg_time
  FROM (
    SELECT 
      p.created_at as signup,
      LEAST(
        COALESCE((SELECT MIN(g.created_at) FROM groups g WHERE g.owner_id = p.id), 'infinity'::timestamp),
        COALESCE((SELECT MIN(e.created_at) FROM expenses e WHERE e.created_by = p.id), 'infinity'::timestamp)
      ) as first_action
    FROM profiles p
    WHERE p.created_at >= CURRENT_DATE - p_days
  ) t
  WHERE first_action != 'infinity'::timestamp;
  
  RETURN QUERY SELECT
    v_signups as total_signups,
    v_activated as activated_users,
    CASE WHEN v_signups > 0 THEN ROUND(v_activated::DECIMAL / v_signups * 100, 2) ELSE 0 END as activation_rate,
    v_7d_active as seven_day_active,
    CASE WHEN v_signups > 0 THEN ROUND(v_7d_active::DECIMAL / v_signups * 100, 2) ELSE 0 END as retention_to_7d,
    v_paid as converted_to_paid,
    CASE WHEN v_signups > 0 THEN ROUND(v_paid::DECIMAL / v_signups * 100, 2) ELSE 0 END as conversion_rate,
    COALESCE(v_avg_time, INTERVAL '0') as avg_time_to_first_value;
END;
$$;

-- Function: Get top actions consuming credits
CREATE OR REPLACE FUNCTION public.get_top_credit_actions(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  action_type TEXT,
  total_consumed BIGINT,
  usage_count BIGINT,
  avg_per_use DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.action_type,
    SUM(c.amount_consumed)::BIGINT as total_consumed,
    COUNT(*)::BIGINT as usage_count,
    ROUND(AVG(c.amount_consumed), 2) as avg_per_use
  FROM credit_consumption_log c
  GROUP BY c.action_type
  ORDER BY total_consumed DESC
  LIMIT p_limit;
END;
$$;