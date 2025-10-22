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
      if (!user) {
        // Reset to default values for unauthenticated users
        setRewards([]);
        setTotalDaysEarned(0);
        setRemainingDays(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Silent error handling - don't show toast on every fetch
        console.warn("Error fetching referral rewards:", error);
        return;
      }

      setRewards(data || []);
      
      const totalEarned = data?.reduce((sum, reward) => sum + reward.days_earned, 0) || 0;
      const remainingUnused = data?.filter(r => !r.applied_to_subscription)
        .reduce((sum, reward) => sum + reward.days_earned, 0) || 0;
      
      setTotalDaysEarned(totalEarned);
      setRemainingDays(remainingUnused);
    } catch (error) {
      console.warn("Unexpected error fetching referral rewards:", error);
      // Don't show toast for background fetches
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
      if (!reward) {
        toast.error("المكافأة غير موجودة");
        return { error: "reward_not_found" };
      }

      if (reward.applied_to_subscription) {
        toast.error("المكافأة مستخدمة مسبقاً");
        return { error: "reward_already_applied" };
      }

      // Mark reward as applied in a transaction
      const { error: updateError } = await supabase
        .from("referral_rewards")
        .update({
          applied_to_subscription: true,
          applied_at: new Date().toISOString()
        })
        .eq("id", rewardId)
        .eq("applied_to_subscription", false); // Extra safety check

      if (updateError) {
        console.error("Error updating reward:", updateError);
        toast.error("خطأ في تحديث حالة المكافأة");
        return { error: updateError.message };
      }

      // Get current subscription
      const { data: subscription, error: subError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subError) {
        console.error("Error fetching subscription:", subError);
        // Rollback the reward update
        await supabase
          .from("referral_rewards")
          .update({
            applied_to_subscription: false,
            applied_at: null
          })
          .eq("id", rewardId);
        
        toast.error("خطأ في جلب بيانات الاشتراك");
        return { error: subError.message };
      }

      try {
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
      } catch (subscriptionError) {
        console.error("Error updating subscription:", subscriptionError);
        
        // Rollback the reward update
        await supabase
          .from("referral_rewards")
          .update({
            applied_to_subscription: false,
            applied_at: null
          })
          .eq("id", rewardId);
        
        toast.error("خطأ في تحديث الاشتراك، تم التراجع عن العملية");
        return { error: (subscriptionError as Error).message };
      }
    } catch (error) {
      console.error("Error applying reward:", error);
      toast.error("خطأ غير متوقع في تطبيق المكافأة");
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