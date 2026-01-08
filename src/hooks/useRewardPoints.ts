import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// مصادر نقاط المكافآت - 3 طرق فقط
export const REWARD_SOURCES = {
  // نقاط الترحيب - 50 نقطة مرة واحدة (7 أيام صلاحية)
  welcome: { amount: 50, nameAr: 'مكافأة الترحيب', nameEn: 'Welcome Bonus' },
  // النقاط اليومية - 5 نقاط (لا تتراكم، تنتهي نهاية اليوم)
  daily_login: { amount: 5, nameAr: 'نقاط يومية', nameEn: 'Daily Points' },
  // نقاط الإحالة - 30 نقطة (10 + 20)
  referral_first_usage: { amount: 10, nameAr: 'أول استخدام للمدعو', nameEn: 'Referral First Usage' },
  referral_group_settlement: { amount: 20, nameAr: 'مدعو أنشأ قروب/تسوية', nameEn: 'Referral Group/Settlement' }
} as const;

export type RewardSourceType = keyof typeof REWARD_SOURCES;

interface RewardPointsSummary {
  totalEarned: number;
  totalConverted: number;
  availableBalance: number;
  lastConversionAt: Date | null;
  canConvert: boolean;
  nextConversionAt: Date | null;
}

export function useRewardPoints() {
  const [summary, setSummary] = useState<RewardPointsSummary>({
    totalEarned: 0,
    totalConverted: 0,
    availableBalance: 0,
    lastConversionAt: null,
    canConvert: false,
    nextConversionAt: null
  });
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchSummary = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reward_points_summary')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching reward summary:', error);
        return;
      }

      if (data) {
        setSummary({
          totalEarned: data.total_earned || 0,
          totalConverted: data.total_converted || 0,
          availableBalance: data.available_balance || 0,
          lastConversionAt: data.last_conversion_at ? new Date(data.last_conversion_at) : null,
          canConvert: (data.available_balance || 0) >= 10,
          nextConversionAt: null
        });
      }
    } catch (error) {
      console.error('Error in fetchSummary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRewardPoints = useCallback(async (source: RewardSourceType): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const rewardSource = REWARD_SOURCES[source];

      const { data, error } = await supabase.rpc('add_reward_points', {
        p_user_id: user.id,
        p_amount: rewardSource.amount,
        p_source: source,
        p_description_ar: rewardSource.nameAr
      });

      if (error) {
        console.error('Error adding reward points:', error);
        return false;
      }

      await fetchSummary();
      queryClient.invalidateQueries({ queryKey: ['reward-points'] });
      // RPC يرجع JSONB كـ object فيه success
      const result = data as { success?: boolean } | null;
      return result?.success === true;
    } catch (error) {
      console.error('Error in addRewardPoints:', error);
      return false;
    }
  }, [fetchSummary, queryClient]);

  const convertToCredits = useCallback(async (points: number): Promise<{ success: boolean; creditsEarned: number }> => {
    if (points < 10) return { success: false, creditsEarned: 0 };

    setConverting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, creditsEarned: 0 };

      const { data, error } = await supabase.rpc('convert_rewards_to_credits', {
        p_user_id: user.id
      });

      if (error) {
        toast({ title: 'فشل التحويل', variant: 'destructive' });
        return { success: false, creditsEarned: 0 };
      }

      // RPC يرجع JSONB كـ object فيه success و uc_received
      const result = data as { success?: boolean; uc_received?: number; reason?: string } | null;
      if (result?.success === true) {
        const creditsEarned = result.uc_received ?? Math.floor(points / 10);
        await fetchSummary();
        queryClient.invalidateQueries({ queryKey: ['usage-credits'] });
        toast({ title: `تم التحويل! حصلت على ${creditsEarned} نقطة` });
        return { success: true, creditsEarned };
      }

      // معالجة الأخطاء
      if (result?.reason === 'insufficient_reward_points') {
        toast({ title: 'رصيد نقاط المكافآت غير كافي', variant: 'destructive' });
      } else if (result?.reason === 'conversion_cooldown') {
        toast({ title: 'يرجى الانتظار قبل التحويل مجدداً', variant: 'destructive' });
      }
      
      return { success: false, creditsEarned: 0 };
    } catch (error) {
      return { success: false, creditsEarned: 0 };
    } finally {
      setConverting(false);
    }
  }, [fetchSummary, queryClient, toast]);

  const getRewardHistory = useCallback(async (limit = 20) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('reward_points')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reward history:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    converting,
    fetchSummary,
    addRewardPoints,
    convertToCredits,
    getRewardHistory,
    REWARD_SOURCES
  };
}
