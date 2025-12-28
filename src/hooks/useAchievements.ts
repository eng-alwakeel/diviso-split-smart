import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_value: number;
  achievement_level: string | null;
  shared: boolean;
  shared_at: string | null;
  shared_platform: string | null;
  coins_earned: number;
  created_at: string;
}

export interface MonthlyStats {
  success: boolean;
  month: number;
  year: number;
  total_expenses: number;
  expense_count: number;
  top_category: string;
  top_category_amount: number;
  groups_count: number;
  savings: number;
  prev_month_total: number;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const { toast } = useToast();

  const fetchAchievements = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_monthly_stats');
      if (error) throw error;
      if (data && typeof data === 'object') {
        setMonthlyStats(data as unknown as MonthlyStats);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  }, []);

  const shareAchievement = useCallback(async (achievementId: string, platform: string) => {
    try {
      const { data, error } = await supabase.rpc('share_achievement', {
        p_achievement_id: achievementId,
        p_platform: platform
      });

      if (error) throw error;
      
      const result = data as { success: boolean; coins_earned?: number; already_shared?: boolean };
      
      if (result.success) {
        toast({
          title: '🎉 تم المشاركة!',
          description: `حصلت على ${result.coins_earned} عملة`,
        });
        fetchAchievements();
        return { success: true, coinsEarned: result.coins_earned };
      } else if (result.already_shared) {
        toast({
          title: 'تم المشاركة مسبقاً',
          description: 'لقد شاركت هذا الإنجاز من قبل',
          variant: 'destructive'
        });
        return { success: false, alreadyShared: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error sharing achievement:', error);
      return { success: false };
    }
  }, [toast, fetchAchievements]);

  const getLatestUnshared = useCallback(() => {
    return achievements.find(a => !a.shared) || null;
  }, [achievements]);

  const getUnsharedCount = useCallback(() => {
    return achievements.filter(a => !a.shared).length;
  }, [achievements]);

  const getAchievementIcon = (type: string, level: string | null): string => {
    const icons: Record<string, string> = {
      expenses_milestone: '📊',
      groups_milestone: '👥',
      savings_milestone: '💰',
      streak_milestone: '🔥',
      referrals_milestone: '🎁',
      onboarding_complete: '🎓'
    };
    return icons[type] || '🏆';
  };

  const getAchievementColor = (level: string | null): string => {
    const colors: Record<string, string> = {
      bronze: 'from-amber-600 to-amber-800',
      silver: 'from-slate-400 to-slate-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600'
    };
    return colors[level || 'bronze'] || colors.bronze;
  };

  useEffect(() => {
    fetchAchievements();
    fetchMonthlyStats();
  }, [fetchAchievements, fetchMonthlyStats]);

  return {
    achievements,
    loading,
    monthlyStats,
    latestUnshared: getLatestUnshared(),
    unsharedCount: getUnsharedCount(),
    shareAchievement,
    refetch: fetchAchievements,
    getAchievementIcon,
    getAchievementColor
  };
};
