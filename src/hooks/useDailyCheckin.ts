import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  points: number;
  coins: number;
  lastCheckIn: string | null;
}

interface WeekProgress {
  day: number;
  completed: boolean;
  isToday: boolean;
  reward: { 
    type: 'coins' | 'badge' | 'soft_unlock' | 'boost'; 
    value: string; 
    coins: number;
    feature?: string;
    icon?: string;
  };
}

// Weekly rewards config - 5 coins per day, extra rewards are badges/features only
const WEEKLY_REWARDS = [
  { type: 'coins' as const, value: '+5 عملات', coins: 5, icon: 'Star' },
  { type: 'coins' as const, value: '+5 عملات', coins: 5, icon: 'Coins' },
  { type: 'badge' as const, value: 'شارة متحمس 🔥', coins: 5, icon: 'Flame' },
  { type: 'coins' as const, value: '+5 عملات', coins: 5, icon: 'Coins' },
  { type: 'soft_unlock' as const, value: 'تحليل AI مجاني', coins: 5, feature: 'ai_insight', icon: 'Sparkles' },
  { type: 'boost' as const, value: 'رفع حد OCR', coins: 5, feature: 'ocr_boost', icon: 'Camera' },
  { type: 'soft_unlock' as const, value: 'تحليلات متقدمة 🏆', coins: 5, feature: 'advanced_analytics', icon: 'Trophy' },
];

// Fetch streak data with both queries combined
const fetchCheckinData = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Run both queries in parallel
  const [streakResult, checkinResult] = await Promise.all([
    supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .single()
  ]);

  const streakData = streakResult.data;
  const checkedInToday = !!checkinResult.data;

  const streak: StreakData = streakData ? {
    currentStreak: streakData.current_streak,
    longestStreak: streakData.longest_streak,
    totalCheckIns: streakData.total_check_ins,
    points: streakData.points,
    coins: streakData.coins ?? 0,
    lastCheckIn: streakData.last_check_in,
  } : {
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    points: 0,
    coins: 0,
    lastCheckIn: null,
  };

  return { streak, checkedInToday };
};

// Calculate week progress
const calculateWeekProgress = (currentStreak: number, checkedToday: boolean): WeekProgress[] => {
  const dayInWeek = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : 0;
  
  return WEEKLY_REWARDS.map((reward, index) => {
    const dayNumber = index + 1;
    let completed = false;

    if (checkedToday) {
      completed = dayNumber <= dayInWeek;
    } else {
      completed = dayNumber < dayInWeek || (dayNumber <= dayInWeek && currentStreak > 0);
    }

    return {
      day: dayNumber,
      completed,
      isToday: !checkedToday && dayNumber === (dayInWeek === 0 ? 1 : Math.min(dayInWeek + 1, 7)),
      reward,
    };
  });
};

export const useDailyCheckin = () => {
  const [claiming, setClaiming] = useState(false);
  const queryClient = useQueryClient();

  // Get user ID
  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Fetch checkin data with React Query
  const { 
    data: checkinData,
    isLoading: loading,
    refetch
  } = useQuery({
    queryKey: ['daily-checkin', userId],
    queryFn: () => fetchCheckinData(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  const streak = checkinData?.streak || {
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    points: 0,
    coins: 0,
    lastCheckIn: null,
  };

  const checkedInToday = checkinData?.checkedInToday || false;

  const weekProgress = useMemo(() => 
    calculateWeekProgress(streak.currentStreak, checkedInToday),
    [streak.currentStreak, checkedInToday]
  );

  const claimReward = useCallback(async () => {
    if (claiming || checkedInToday || !userId) return null;

    setClaiming(true);
    try {
      const dayInWeek = (streak.currentStreak % 7) + 1;
      const reward = WEEKLY_REWARDS[dayInWeek - 1] || WEEKLY_REWARDS[0];

      const { data: result, error } = await supabase.rpc('process_daily_checkin', {
        p_user_id: userId,
        p_reward_type: reward.type,
        p_reward_value: { value: reward.value, coins: reward.coins, feature: reward.feature },
      });

      if (error) throw error;

      const typedResult = result as { success: boolean; new_streak?: number; points_earned?: number; message?: string } | null;

      if (typedResult?.success) {
        toast.success(`🎉 حصلت على ${reward.value}!`, {
          description: `+${reward.coins} عملات | سلسلة ${typedResult.new_streak} أيام`,
        });
        
        queryClient.invalidateQueries({ queryKey: ['daily-checkin'] });
        return typedResult;
      } else if (typedResult?.message === 'already_checked_in') {
        toast.info('لقد سجلت دخولك اليوم بالفعل');
      }

      return null;
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
      return null;
    } finally {
      setClaiming(false);
    }
  }, [claiming, checkedInToday, userId, streak.currentStreak, queryClient]);

  return {
    streak,
    weekProgress,
    checkedInToday,
    loading,
    claiming,
    claimReward,
    refetch,
  };
};
