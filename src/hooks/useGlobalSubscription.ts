import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

export type SubscriptionPlan = 
  | "starter_monthly" | "starter_yearly" 
  | "pro_monthly" | "pro_yearly" 
  | "max_monthly" | "max_yearly"
  | "personal" | "family" | "lifetime"; // للتوافق مع البيانات القديمة
export type SubscriptionStatus = "trialing" | "active" | "expired" | "canceled";

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  first_trial_started_at: string | null;
  total_trial_days_used: number;
}

const SUBSCRIPTION_QUERY_KEY = ['user-subscription'];

// Centralized subscription fetcher - never throws, always returns null on error
async function fetchUserSubscription(): Promise<UserSubscription | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Unexpected error in fetchUserSubscription:', err);
    return null;
  }
}

// Global subscription hook using React Query
export function useGlobalSubscription() {
  const queryClient = useQueryClient();

  const {
    data: subscription,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchUserSubscription,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    enabled: true, // Always enabled, but returns null safely if no user
    throwOnError: false // Don't throw errors, return them in error state
  });

  // Invalidate cache when needed
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
  }, [queryClient]);

  // Update cache optimistically
  const updateCache = useCallback((updater: (old: UserSubscription | null) => UserSubscription | null) => {
    queryClient.setQueryData(SUBSCRIPTION_QUERY_KEY, updater);
  }, [queryClient]);

  return {
    subscription: subscription ?? null,
    loading,
    error,
    refetch,
    invalidate,
    updateCache
  };
}
