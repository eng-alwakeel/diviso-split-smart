import { useState, useEffect, useCallback } from 'react';
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

interface DailyCheckinData {
  streak: StreakData;
  weekProgress: WeekProgress[];
  checkedInToday: boolean;
  loading: boolean;
}

// نظام المكافآت الأسبوعي الجديد (متوافق مع خطة الاشتراك)
const WEEKLY_REWARDS = [
  { type: 'coins' as const, value: 'عملات البداية', coins: 5, icon: 'Star' },
  { type: 'coins' as const, value: '+10 عملات', coins: 10, icon: 'Coins' },
  { type: 'badge' as const, value: 'شارة متحمس 🔥', coins: 15, icon: 'Flame' },
  { type: 'coins' as const, value: '+20 عملات', coins: 20, icon: 'Coins' },
  { type: 'soft_unlock' as const, value: 'تحليل AI مجاني', coins: 15, feature: 'ai_insight', icon: 'Sparkles' },
  { type: 'boost' as const, value: 'رفع حد OCR', coins: 25, feature: 'ocr_boost', icon: 'Camera' },
  { type: 'soft_unlock' as const, value: 'تحليلات متقدمة 🏆', coins: 30, feature: 'advanced_analytics', icon: 'Trophy' },
];

export const useDailyCheckin = () => {
  const [data, setData] = useState<DailyCheckinData>({
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      points: 0,
      coins: 0,
      lastCheckIn: null,
    },
    weekProgress: [],
    checkedInToday: false,
    loading: true,
  });
  const [claiming, setClaiming] = useState(false);

  const calculateWeekProgress = useCallback((currentStreak: number, checkedToday: boolean): WeekProgress[] => {
    const dayInWeek = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : 0;
    
    return WEEKLY_REWARDS.map((reward, index) => {
      const dayNumber = index + 1;
      let completed = false;
      let isToday = false;

      if (checkedToday) {
        completed = dayNumber <= dayInWeek;
        isToday = dayNumber === dayInWeek;
      } else {
        completed = dayNumber < dayInWeek || (dayNumber <= dayInWeek && currentStreak > 0);
        isToday = dayNumber === (dayInWeek === 0 ? 1 : dayInWeek + 1);
        if (isToday && dayNumber > 7) isToday = false;
      }

      return {
        day: dayNumber,
        completed,
        isToday: !checkedToday && dayNumber === (dayInWeek === 0 ? 1 : Math.min(dayInWeek + 1, 7)),
        reward,
      };
    });
  }, []);

  const fetchStreakData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      // جلب بيانات الـ streak
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // التحقق من تسجيل اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: todayCheckin } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .single();

      const checkedInToday = !!todayCheckin;
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

      const weekProgress = calculateWeekProgress(streak.currentStreak, checkedInToday);

      setData({
        streak,
        weekProgress,
        checkedInToday,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching streak data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [calculateWeekProgress]);

  const claimReward = useCallback(async () => {
    if (claiming || data.checkedInToday) return null;

    setClaiming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      const dayInWeek = (data.streak.currentStreak % 7) + 1;
      const reward = WEEKLY_REWARDS[dayInWeek - 1] || WEEKLY_REWARDS[0];

      const { data: result, error } = await supabase.rpc('process_daily_checkin', {
        p_user_id: user.id,
        p_reward_type: reward.type,
        p_reward_value: { value: reward.value, coins: reward.coins, feature: reward.feature },
      });

      if (error) throw error;

      // Type assertion for the RPC result
      const typedResult = result as { success: boolean; new_streak?: number; points_earned?: number; message?: string } | null;

      if (typedResult?.success) {
        toast.success(`🎉 حصلت على ${reward.value}!`, {
          description: `+${reward.coins} عملات | سلسلة ${typedResult.new_streak} أيام`,
        });
        
        await fetchStreakData();
        return typedResult;
      } else if (typedResult?.message === 'already_checked_in') {
        toast.info('لقد سجلت دخولك اليوم بالفعل');
        setData(prev => ({ ...prev, checkedInToday: true }));
      }

      return null;
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
      return null;
    } finally {
      setClaiming(false);
    }
  }, [claiming, data.checkedInToday, data.streak.currentStreak, fetchStreakData]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  return {
    ...data,
    claiming,
    claimReward,
    refetch: fetchStreakData,
  };
};
