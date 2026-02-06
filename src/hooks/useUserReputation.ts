import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserReputation {
  user_id: string;
  average_rating: number;
  total_ratings: number;
  completed_activities: number;
  updated_at: string;
}

interface Profile {
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  bio?: string | null;
}

export const useUserReputation = (userId?: string) => {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch reputation for a specific user
  const fetchReputation = useCallback(async (targetUserId?: string) => {
    const uid = targetUserId || userId;
    if (!uid) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (!error && data) {
        const rep = data as UserReputation;
        setReputation(rep);
        return rep;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch reputation on mount if userId provided
  useEffect(() => {
    if (userId) {
      fetchReputation();
    }
  }, [userId, fetchReputation]);

  // Calculate profile completion percentage
  const calculateProfileCompletion = useCallback((profile: Profile): number => {
    let score = 0;
    const total = 4; // Number of fields to check

    if (profile.display_name || profile.name) score++;
    if (profile.avatar_url) score++;
    if (profile.city) score++;
    if (profile.bio) score++;

    return Math.round((score / total) * 100);
  }, []);

  // Get completion status text
  const getCompletionStatus = useCallback((percentage: number): {
    text: string;
    color: string;
  } => {
    if (percentage >= 100) {
      return { text: 'مكتمل', color: 'text-green-600' };
    } else if (percentage >= 75) {
      return { text: 'شبه مكتمل', color: 'text-blue-600' };
    } else if (percentage >= 50) {
      return { text: 'متوسط', color: 'text-yellow-600' };
    } else {
      return { text: 'غير مكتمل', color: 'text-red-600' };
    }
  }, []);

  // Get rating display (stars or text)
  const getRatingDisplay = useCallback((avgRating: number): {
    stars: number;
    text: string;
  } => {
    const roundedRating = Math.round(avgRating * 10) / 10;
    
    if (avgRating >= 4.5) {
      return { stars: 5, text: 'ممتاز' };
    } else if (avgRating >= 3.5) {
      return { stars: 4, text: 'جيد جداً' };
    } else if (avgRating >= 2.5) {
      return { stars: 3, text: 'جيد' };
    } else if (avgRating >= 1.5) {
      return { stars: 2, text: 'مقبول' };
    } else if (avgRating >= 0.5) {
      return { stars: 1, text: 'ضعيف' };
    } else {
      return { stars: 0, text: 'لا يوجد تقييم' };
    }
  }, []);

  return {
    reputation,
    loading,
    fetchReputation,
    calculateProfileCompletion,
    getCompletionStatus,
    getRatingDisplay
  };
};
