import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserActivityMetrics {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
}

export interface RetentionCohort {
  cohort_date: string;
  cohort_size: number;
  d1_retained: number;
  d7_retained: number;
  d30_retained: number;
  d1_rate: number;
  d7_rate: number;
  d30_rate: number;
}

export interface CreditsEconomyHealth {
  total_earned: number;
  total_consumed: number;
  total_expired: number;
  total_purchased: number;
  burn_rate: number;
  expiry_rate: number;
  earned_vs_purchased_ratio: number;
  paywall_hit_count: number;
  paywall_conversion_rate: number;
}

export interface RevenueMetrics {
  total_monthly_revenue: number;
  subscription_revenue: number;
  credits_revenue: number;
  subscriber_count: number;
  new_subscribers: number;
  churned_subscribers: number;
  churn_rate: number;
  arppu: number;
}

export interface GrowthLoopMetrics {
  total_invites_sent: number;
  invites_this_week: number;
  invites_accepted: number;
  invite_conversion_rate: number;
  referral_signups: number;
  referral_signup_rate: number;
  k_factor: number;
  active_referrers: number;
}

export interface FunnelMetrics {
  total_signups: number;
  activated_users: number;
  activation_rate: number;
  seven_day_active: number;
  retention_to_7d: number;
  converted_to_paid: number;
  conversion_rate: number;
  avg_time_to_first_value: string;
}

export interface TopCreditAction {
  action_type: string;
  total_consumed: number;
  usage_count: number;
  avg_per_use: number;
}

// Hook for user activity metrics (DAU, MAU, Stickiness)
export function useUserActivityMetrics() {
  return useQuery({
    queryKey: ['admin-user-activity'],
    queryFn: async (): Promise<UserActivityMetrics> => {
      const { data, error } = await supabase.rpc('get_user_activity_metrics');
      if (error) throw error;
      return data?.[0] || {
        dau: 0, wau: 0, mau: 0, stickiness: 0,
        new_users_today: 0, new_users_week: 0, new_users_month: 0
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Hook for retention cohorts
export function useRetentionCohorts(weeks: number = 8) {
  return useQuery({
    queryKey: ['admin-retention-cohorts', weeks],
    queryFn: async (): Promise<RetentionCohort[]> => {
      const { data, error } = await supabase.rpc('get_retention_cohorts', { p_weeks: weeks });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Hook for credits economy health
export function useCreditsEconomyHealth() {
  return useQuery({
    queryKey: ['admin-credits-economy'],
    queryFn: async (): Promise<CreditsEconomyHealth> => {
      const { data, error } = await supabase.rpc('get_credits_economy_health');
      if (error) throw error;
      return data?.[0] || {
        total_earned: 0, total_consumed: 0, total_expired: 0, total_purchased: 0,
        burn_rate: 0, expiry_rate: 0, earned_vs_purchased_ratio: 0,
        paywall_hit_count: 0, paywall_conversion_rate: 0
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Hook for revenue metrics
export function useRevenueMetricsKPI() {
  return useQuery({
    queryKey: ['admin-revenue-metrics'],
    queryFn: async (): Promise<RevenueMetrics> => {
      const { data, error } = await supabase.rpc('get_revenue_metrics');
      if (error) throw error;
      return data?.[0] || {
        total_monthly_revenue: 0, subscription_revenue: 0, credits_revenue: 0,
        subscriber_count: 0, new_subscribers: 0, churned_subscribers: 0,
        churn_rate: 0, arppu: 0
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Hook for growth loop metrics
export function useGrowthLoopMetrics() {
  return useQuery({
    queryKey: ['admin-growth-loop'],
    queryFn: async (): Promise<GrowthLoopMetrics> => {
      const { data, error } = await supabase.rpc('get_growth_loop_metrics');
      if (error) throw error;
      return data?.[0] || {
        total_invites_sent: 0, invites_this_week: 0, invites_accepted: 0,
        invite_conversion_rate: 0, referral_signups: 0, referral_signup_rate: 0,
        k_factor: 0, active_referrers: 0
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Hook for funnel metrics
export function useFunnelMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['admin-funnel-metrics', days],
    queryFn: async (): Promise<FunnelMetrics> => {
      const { data, error } = await supabase.rpc('get_funnel_metrics', { p_days: days });
      if (error) throw error;
      const result = data?.[0];
      return {
        total_signups: result?.total_signups || 0,
        activated_users: result?.activated_users || 0,
        activation_rate: result?.activation_rate || 0,
        seven_day_active: result?.seven_day_active || 0,
        retention_to_7d: result?.retention_to_7d || 0,
        converted_to_paid: result?.converted_to_paid || 0,
        conversion_rate: result?.conversion_rate || 0,
        avg_time_to_first_value: String(result?.avg_time_to_first_value || '0')
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Hook for top credit actions
export function useTopCreditActions(limit: number = 10) {
  return useQuery({
    queryKey: ['admin-top-credit-actions', limit],
    queryFn: async (): Promise<TopCreditAction[]> => {
      const { data, error } = await supabase.rpc('get_top_credit_actions', { p_limit: limit });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Combined hook for all KPIs
export function useAllAdminKPIs() {
  const activity = useUserActivityMetrics();
  const retention = useRetentionCohorts();
  const credits = useCreditsEconomyHealth();
  const revenue = useRevenueMetricsKPI();
  const growth = useGrowthLoopMetrics();
  const funnel = useFunnelMetrics();
  const creditActions = useTopCreditActions();

  const isLoading = activity.isLoading || retention.isLoading || credits.isLoading || 
                    revenue.isLoading || growth.isLoading || funnel.isLoading || creditActions.isLoading;

  const refetchAll = () => {
    activity.refetch();
    retention.refetch();
    credits.refetch();
    revenue.refetch();
    growth.refetch();
    funnel.refetch();
    creditActions.refetch();
  };

  return {
    activity: activity.data,
    retention: retention.data,
    credits: credits.data,
    revenue: revenue.data,
    growth: growth.data,
    funnel: funnel.data,
    creditActions: creditActions.data,
    isLoading,
    refetchAll,
  };
}
