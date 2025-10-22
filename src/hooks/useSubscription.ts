import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReferralRewards } from "./useReferralRewards";
import { useGlobalSubscription } from "./useGlobalSubscription";
import { useGlobalTrialDays } from "./useGlobalTrialDays";

export type SubscriptionPlan = "personal" | "family" | "lifetime";
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

export function useSubscription() {
  // Use global hooks for shared data
  const { subscription, loading, refetch, updateCache, invalidate } = useGlobalSubscription();
  const { remainingTrialDays } = useGlobalTrialDays();
  const { remainingDays: freeDaysFromReferrals } = useReferralRewards();

  // No useEffect needed - global hooks handle fetching

  const startTrial = useCallback(async (plan: SubscriptionPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "not_authenticated" } as const;
    }
    
    try {
      if (remainingTrialDays <= 0) {
        return { error: "trial_expired" } as const;
      }
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .insert({ 
          user_id: user.id, 
          plan, 
          status: "trialing" as const,
          first_trial_started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + remainingTrialDays * 24 * 60 * 60 * 1000).toISOString()
        })
        .select("*")
        .single();
        
      if (error) {
        if ((error as any).code === "23505") {
          return await switchPlan(plan);
        }
        throw error;
      }
      
      updateCache(() => data as UserSubscription);
      invalidate();
      return { data: data as UserSubscription } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [remainingTrialDays, updateCache, invalidate]);

  const isTrialActive = useMemo(() => {
    if (!subscription) return false;
    if (subscription.status !== "trialing") return false;
    const now = Date.now();
    const exp = new Date(subscription.expires_at).getTime();
    return exp > now;
  }, [subscription]);

  const daysLeft = useMemo(() => {
    if (!subscription) return 0;
    const exp = new Date(subscription.expires_at).getTime();
    const diff = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [subscription]);

  const switchPlan = useCallback(async (newPlan: SubscriptionPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "not_authenticated" } as const;
    }
    
    try {
      if (remainingTrialDays <= 0) {
        return { error: "trial_expired" } as const;
      }
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .update({ 
          plan: newPlan,
          expires_at: new Date(Date.now() + remainingTrialDays * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq("user_id", user.id)
        .select("*")
        .single();
        
      if (error) throw error;
      
      updateCache(() => data as UserSubscription);
      invalidate();
      return { data: data as UserSubscription } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [remainingTrialDays, updateCache, invalidate]);

  const totalDaysLeft = useMemo(() => {
    return daysLeft + freeDaysFromReferrals;
  }, [daysLeft, freeDaysFromReferrals]);

  const canStartTrial = useMemo(() => {
    return remainingTrialDays > 0;
  }, [remainingTrialDays]);

  const canSwitchPlan = useMemo(() => {
    return subscription?.status === 'trialing' && remainingTrialDays > 0;
  }, [subscription?.status, remainingTrialDays]);

  // Cancel subscription function
  const cancelSubscription = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "not_authenticated" } as const;
    }
    
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .update({ 
          status: "canceled" as const,
          canceled_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .select("*")
        .single();
        
      if (error) throw error;
      
      updateCache(() => data as UserSubscription);
      invalidate();
      return { data: data as UserSubscription } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [updateCache, invalidate]);

  // Dev-only functions for testing
  const devSetSubscription = useCallback(async (plan: SubscriptionPlan, status: SubscriptionStatus, daysToExpire: number) => {
    if (!import.meta.env.DEV) {
      console.warn('devSetSubscription is only available in development mode');
      return { error: "dev_only" } as const;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "not_authenticated" } as const;
    }
    
    try {
      const expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000).toISOString();
      const startedAt = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .upsert({ 
          user_id: user.id,
          plan,
          status,
          started_at: startedAt,
          expires_at: expiresAt,
          canceled_at: status === 'canceled' ? new Date().toISOString() : null,
          first_trial_started_at: status === 'trialing' ? startedAt : null
        })
        .select("*")
        .single();
        
      if (error) throw error;
      
      updateCache(() => data as UserSubscription);
      invalidate();
      return { data: data as UserSubscription } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [updateCache, invalidate]);

  const devResetToFree = useCallback(async () => {
    if (!import.meta.env.DEV) {
      console.warn('devResetToFree is only available in development mode');
      return { error: "dev_only" } as const;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "not_authenticated" } as const;
    }
    
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .delete()
        .eq("user_id", user.id);
        
      if (error) throw error;
      
      updateCache(() => null);
      invalidate();
      return { data: "success" } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [updateCache, invalidate]);

  const devAddDays = useCallback(async (days: number) => {
    if (!import.meta.env.DEV) {
      console.warn('devAddDays is only available in development mode');
      return { error: "dev_only" } as const;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !subscription) {
      return { error: "not_authenticated_or_no_subscription" } as const;
    }
    
    try {
      const currentExpiry = new Date(subscription.expires_at);
      const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .update({ 
          expires_at: newExpiry.toISOString()
        })
        .eq("user_id", user.id)
        .select("*")
        .single();
        
      if (error) throw error;
      
      updateCache(() => data as UserSubscription);
      invalidate();
      return { data: data as UserSubscription } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [subscription, updateCache, invalidate]);

  // Force refresh function that clears cache and refetches
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing subscription data...');
    invalidate();
    await refetch();
    console.log('✅ Force refresh complete');
  }, [invalidate, refetch]);

  return {
    subscription,
    isTrialActive,
    daysLeft,
    totalDaysLeft,
    remainingTrialDays,
    canStartTrial,
    canSwitchPlan,
    loading,
    refresh: refetch,
    forceRefresh,
    startTrial,
    switchPlan,
    cancelSubscription,
    freeDaysFromReferrals,
    // Dev-only functions
    devSetSubscription,
    devResetToFree,
    devAddDays,
  };
}
