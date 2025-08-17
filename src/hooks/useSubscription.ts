import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReferralRewards } from "./useReferralRewards";

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
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [remainingTrialDays, setRemainingTrialDays] = useState<number>(7);
  const { remainingDays: freeDaysFromReferrals } = useReferralRewards();

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('useSubscription: No user found');
        setSubscription(null);
        setRemainingTrialDays(7);
        return;
      }
      
      console.log('useSubscription: Fetching subscription for user:', user.id);
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (error) {
        console.error('useSubscription: Database error:', error);
        throw error;
      }
      
      // Get remaining trial days
      const { data: trialDaysData, error: trialError } = await supabase
        .rpc('get_remaining_trial_days', { p_user_id: user.id });
      
      if (trialError) {
        console.error('useSubscription: Error getting trial days:', trialError);
      } else {
        setRemainingTrialDays(trialDaysData ?? 7);
      }
      
      console.log('useSubscription: Retrieved data:', data);
      setSubscription(data ?? null);
    } catch (e) {
      console.error('useSubscription: Error fetching subscription:', e);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const startTrial = useCallback(async (plan: SubscriptionPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "not_authenticated" } as const;
    }
    
    try {
      // Check remaining trial days first
      const { data: trialDaysData } = await supabase
        .rpc('get_remaining_trial_days', { p_user_id: user.id });
      
      if (trialDaysData <= 0) {
        return { error: "trial_expired" } as const;
      }
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .insert({ 
          user_id: user.id, 
          plan, 
          status: "trialing" as const,
          first_trial_started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + trialDaysData * 24 * 60 * 60 * 1000).toISOString()
        })
        .select("*")
        .single();
        
      if (error) {
        // Unique violation means the user already has a row - try switching plan instead
        if ((error as any).code === "23505") {
          return await switchPlan(plan);
        }
        throw error;
      }
      
      setSubscription(data as UserSubscription);
      await fetchSubscription(); // Refresh trial days
      return { data: data as UserSubscription } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, []);

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
      // Check if user has remaining trial days
      const { data: trialDaysData } = await supabase
        .rpc('get_remaining_trial_days', { p_user_id: user.id });
      
      if (trialDaysData <= 0) {
        return { error: "trial_expired" } as const;
      }
      
      // Update existing subscription to new plan
      const { data, error } = await supabase
        .from("user_subscriptions")
        .update({ 
          plan: newPlan,
          expires_at: new Date(Date.now() + trialDaysData * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq("user_id", user.id)
        .select("*")
        .single();
        
      if (error) throw error;
      
      setSubscription(data as UserSubscription);
      await fetchSubscription(); // Refresh trial days
      return { data: data as UserSubscription } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [fetchSubscription]);

  const totalDaysLeft = useMemo(() => {
    return daysLeft + freeDaysFromReferrals;
  }, [daysLeft, freeDaysFromReferrals]);

  const canStartTrial = useMemo(() => {
    return remainingTrialDays > 0;
  }, [remainingTrialDays]);

  const canSwitchPlan = useMemo(() => {
    return subscription?.status === 'trialing' && remainingTrialDays > 0;
  }, [subscription?.status, remainingTrialDays]);

  return {
    subscription,
    isTrialActive,
    daysLeft,
    totalDaysLeft,
    remainingTrialDays,
    canStartTrial,
    canSwitchPlan,
    loading,
    refresh: fetchSubscription,
    startTrial,
    switchPlan,
    freeDaysFromReferrals,
  };
}
