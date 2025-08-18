import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserEngagement {
  points: number;
  level: number;
  badges: string[];
  streakDays: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_expense',
    name: 'المصروف الأول',
    description: 'أضف أول مصروف لك',
    icon: 'Star',
    earned: false
  },
  {
    id: 'expense_master',
    name: 'خبير المصاريف',
    description: 'أضف 10 مصاريف',
    icon: 'Award',
    earned: false
  },
  {
    id: 'group_creator',
    name: 'منشئ المجموعات',
    description: 'أنشئ أول مجموعة',
    icon: 'Users',
    earned: false
  },
  {
    id: 'ocr_expert',
    name: 'خبير الإيصالات',
    description: 'استخدم OCR 5 مرات',
    icon: 'Camera',
    earned: false
  },
  {
    id: 'weekly_warrior',
    name: 'محارب الأسبوع',
    description: 'استخدم التطبيق 7 أيام متتالية',
    icon: 'Calendar',
    earned: false
  }
];

export const useUserEngagement = () => {
  const [engagement, setEngagement] = useState<UserEngagement>({
    points: 0,
    level: 1,
    badges: [],
    streakDays: 0,
    achievements: ACHIEVEMENTS
  });

  useEffect(() => {
    loadEngagementData();
  }, []);

  const loadEngagementData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from localStorage first
      const saved = localStorage.getItem(`engagement_${user.id}`);
      if (saved) {
        setEngagement(JSON.parse(saved));
      }

      // Check for new achievements
      await checkAchievements();
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }
  };

  const checkAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('created_by', user.id);

      const { data: groups } = await supabase
        .from('groups')
        .select('id')
        .eq('owner_id', user.id);

      // Check OCR usage from expenses with receipts instead
      const { data: ocrUsage } = await supabase
        .from('expense_receipts')
        .select('id')
        .eq('uploaded_by', user.id);

      setEngagement(prev => {
        const updated = { ...prev };
        let newPoints = 0;

        // Check achievements
        updated.achievements = updated.achievements.map(achievement => {
          if (achievement.earned) return achievement;

          let shouldEarn = false;
          switch (achievement.id) {
            case 'first_expense':
              shouldEarn = (expenses?.length || 0) >= 1;
              break;
            case 'expense_master':
              shouldEarn = (expenses?.length || 0) >= 10;
              break;
            case 'group_creator':
              shouldEarn = (groups?.length || 0) >= 1;
              break;
            case 'ocr_expert':
              shouldEarn = (ocrUsage?.length || 0) >= 5;
              break;
          }

          if (shouldEarn) {
            newPoints += 100;
            return {
              ...achievement,
              earned: true,
              earnedAt: new Date().toISOString()
            };
          }

          return achievement;
        });

        updated.points += newPoints;
        updated.level = Math.floor(updated.points / 500) + 1;

        // Save to localStorage
        localStorage.setItem(`engagement_${user.id}`, JSON.stringify(updated));

        return updated;
      });
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const addPoints = (points: number, reason?: string) => {
    setEngagement(prev => {
      const updated = {
        ...prev,
        points: prev.points + points
      };
      updated.level = Math.floor(updated.points / 500) + 1;
      return updated;
    });
  };

  const earnBadge = (badge: string) => {
    setEngagement(prev => ({
      ...prev,
      badges: [...prev.badges, badge]
    }));
  };

  return {
    engagement,
    addPoints,
    earnBadge,
    checkAchievements
  };
};