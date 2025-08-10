import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "personal" | "family";
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
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        return;
      }
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setSubscription(data ?? null);
    } catch (e) {
      // noop: keep null
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
      const { data, error } = await supabase
        .from("user_subscriptions")
        .insert({ user_id: user.id, plan, status: "trialing" as const })
        .select("*")
        .single();
      if (error) {
        // Unique violation means the user already has a row
        if ((error as any).code === "23505") {
          // Fetch existing
          const { data: existing } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (existing) setSubscription(existing as UserSubscription);
          return { error: "trial_exists" } as const;
        }
        throw error;
      }
      setSubscription(data as UserSubscription);
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

  return {
    subscription,
    isTrialActive,
    daysLeft,
    loading,
    refresh: fetchSubscription,
    startTrial,
  };
}
