import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReferralReward {
  id: string;
  referral_id: string;
  days_earned: number;
  applied_to_subscription: boolean;
  applied_at: string | null;
  created_at: string;
}

export function useReferralRewards() {
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDaysEarned, setTotalDaysEarned] = useState(0);
  const [remainingDays, setRemainingDays] = useState(0);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRewards(data || []);
      
      const totalEarned = data?.reduce((sum, reward) => sum + reward.days_earned, 0) || 0;
      const remainingUnused = data?.filter(r => !r.applied_to_subscription)
        .reduce((sum, reward) => sum + reward.days_earned, 0) || 0;
      
      setTotalDaysEarned(totalEarned);
      setRemainingDays(remainingUnused);
    } catch (error) {
      console.error("Error fetching referral rewards:", error);
      toast.error("خطأ في جلب بيانات المكافآت");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyRewardToSubscription = useCallback(async (rewardId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return { error: "not_authenticated" };
      }

      // Find the reward
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward || reward.applied_to_subscription) {
        toast.error("المكافأة غير متوفرة أو مستخدمة مسبقاً");
        return { error: "reward_not_available" };
      }

      // Mark reward as applied
      const { error: updateError } = await supabase
        .from("referral_rewards")
        .update({
          applied_to_subscription: true,
          applied_at: new Date().toISOString()
        })
        .eq("id", rewardId);

      if (updateError) throw updateError;

      // Get current subscription
      const { data: subscription, error: subError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subError) throw subError;

      if (subscription) {
        // Extend existing subscription
        const currentExpiry = new Date(subscription.expires_at);
        const newExpiry = new Date(currentExpiry.getTime() + (reward.days_earned * 24 * 60 * 60 * 1000));

        const { error: extendError } = await supabase
          .from("user_subscriptions")
          .update({
            expires_at: newExpiry.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", subscription.id);

        if (extendError) throw extendError;
      } else {
        // Create new trial subscription with free days
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + (reward.days_earned * 24 * 60 * 60 * 1000));

        const { error: createError } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan: "personal",
            status: "trialing",
            started_at: startDate.toISOString(),
            expires_at: endDate.toISOString()
          });

        if (createError) throw createError;
      }

      toast.success(`تم إضافة ${reward.days_earned} أيام مجانية لاشتراكك!`);
      
      // Refresh rewards
      await fetchRewards();
      
      return { success: true };
    } catch (error) {
      console.error("Error applying reward:", error);
      toast.error("خطأ في تطبيق المكافأة");
      return { error: (error as Error).message };
    }
  }, [rewards, fetchRewards]);

  const canApplyRewards = useCallback(() => {
    return remainingDays > 0;
  }, [remainingDays]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  return {
    rewards,
    loading,
    totalDaysEarned,
    remainingDays,
    applyRewardToSubscription,
    canApplyRewards,
    refresh: fetchRewards
  };
}