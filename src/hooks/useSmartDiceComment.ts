import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsEvents } from '@/hooks/useAnalyticsEvents';

interface SmartCommentContext {
  diceType: string;
  resultLabel: string;
  resultLabelAr?: string;
  groupType?: string;
  memberCount?: number;
}

interface UseSmartDiceCommentReturn {
  comment: string | null;
  isLoading: boolean;
  generateComment: (context: SmartCommentContext) => Promise<void>;
  clearComment: () => void;
}

// Fallback comments for when API fails
const FALLBACK_COMMENTS: Record<string, string[]> = {
  morning: [
    'بداية يوم حلوة 🌅',
    'اختيار صباحي مثالي ☀️',
  ],
  afternoon: [
    'خيار حلو لنص اليوم 👌',
    'اختيار موفق للوقت الحالي',
  ],
  evening: [
    'مناسب للمسا 🌆',
    'اختيار يناسب وقتكم',
  ],
  night: [
    'خيار مريح يناسب الليل 🌙',
    'اختيار هادي للوقت الحالي',
  ],
};

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getLocalFallback(): string {
  const timeOfDay = getTimeOfDay();
  const comments = FALLBACK_COMMENTS[timeOfDay];
  return comments[Math.floor(Math.random() * comments.length)];
}

export function useSmartDiceComment(): UseSmartDiceCommentReturn {
  const [comment, setComment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { trackEvent } = useAnalyticsEvents();

  const generateComment = useCallback(async (context: SmartCommentContext) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-dice-comment', {
        body: {
          dice_type: context.diceType,
          result_label: context.resultLabel,
          result_label_ar: context.resultLabelAr,
          group_type: context.groupType,
          member_count: context.memberCount,
          time_of_day: getTimeOfDay(),
        }
      });

      if (error) throw error;

      if (data?.comment) {
        setComment(data.comment);
        trackEvent('smart_comment_shown', {
          dice_type: context.diceType,
          time_of_day: getTimeOfDay(),
        });
      } else {
        // Use local fallback
        setComment(getLocalFallback());
      }
    } catch (err) {
      console.error('Error generating smart comment:', err);
      // Use local fallback on error
      setComment(getLocalFallback());
    } finally {
      setIsLoading(false);
    }
  }, [trackEvent]);

  const clearComment = useCallback(() => {
    setComment(null);
  }, []);

  return {
    comment,
    isLoading,
    generateComment,
    clearComment,
  };
}
