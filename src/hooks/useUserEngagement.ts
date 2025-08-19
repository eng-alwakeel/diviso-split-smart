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
  // TODO: نظام نقاط الولاء معطل مؤقتاً - سيتم تفعيله في الإصدار الثاني
  const [engagement, setEngagement] = useState<UserEngagement>({
    points: 0,
    level: 1,
    badges: [],
    streakDays: 0,
    achievements: ACHIEVEMENTS
  });

  // معطل مؤقتاً للتركيز على الإطلاق
  // useEffect(() => {
  //   loadEngagementData();
  // }, []);

  const loadEngagementData = async () => {
    // TODO: معطل مؤقتاً للتركيز على الإطلاق
    // try {
    //   const { data: { user } } = await supabase.auth.getUser();
    //   if (!user) return;
    //   const saved = localStorage.getItem(`engagement_${user.id}`);
    //   if (saved) {
    //     setEngagement(JSON.parse(saved));
    //   }
    //   await checkAchievements();
    // } catch (error) {
    //   console.error('Error loading engagement data:', error);
    // }
  };

  const checkAchievements = async () => {
    // TODO: معطل مؤقتاً - سيتم تفعيله في الإصدار الثاني
    return;
    // try {
    //   const { data: { user } } = await supabase.auth.getUser();
    //   if (!user) return;
    //   ... rest of function disabled
    // } catch (error) {
    //   console.error('Error checking achievements:', error);
    // }
  };

  const addPoints = (points: number, reason?: string) => {
    // TODO: معطل مؤقتاً
    console.log(`Points system disabled: would add ${points} points for ${reason}`);
  };

  const earnBadge = (badge: string) => {
    // TODO: معطل مؤقتاً  
    console.log(`Badge system disabled: would earn badge ${badge}`);
  };

  return {
    engagement,
    addPoints,
    earnBadge,
    checkAchievements
  };
};