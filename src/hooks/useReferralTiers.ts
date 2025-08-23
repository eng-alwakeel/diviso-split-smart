import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReferralTier {
  id: string;
  tier_name: string;
  min_referrals: number;
  max_referrals: number | null;
  days_reward: number;
  bonus_multiplier: number;
  tier_color: string;
  tier_icon: string;
}

export interface UserTierInfo {
  tier_name: string;
  tier_icon: string;
  tier_color: string;
  current_referrals: number;
  next_tier_name: string | null;
  referrals_needed: number;
  total_reward_days: number;
}

export function useReferralTiers() {
  const [tiers, setTiers] = useState<ReferralTier[]>([]);
  const [userTier, setUserTier] = useState<UserTierInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTiers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("referral_tiers")
        .select("*")
        .order("min_referrals", { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error("Error fetching referral tiers:", error);
    }
  }, []);

  const fetchUserTier = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_referral_tier', {
        p_user_id: user.id
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setUserTier(data[0]);
      }
    } catch (error) {
      console.error("Error fetching user tier:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProgressToNextTier = useCallback(() => {
    if (!userTier || !userTier.next_tier_name) return 100;
    
    const currentTier = tiers.find(t => t.tier_name === userTier.tier_name);
    const nextTier = tiers.find(t => t.tier_name === userTier.next_tier_name);
    
    if (!currentTier || !nextTier) return 0;
    
    const progress = ((userTier.current_referrals - currentTier.min_referrals) / 
                     (nextTier.min_referrals - currentTier.min_referrals)) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  }, [userTier, tiers]);

  useEffect(() => {
    fetchTiers();
    fetchUserTier();
  }, [fetchTiers, fetchUserTier]);

  return {
    tiers,
    userTier,
    loading,
    getProgressToNextTier,
    refresh: () => {
      fetchTiers();
      fetchUserTier();
    }
  };
}