import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useRealStreak(userId: string | undefined) {
  const queryClient = useQueryClient();

  const logAction = useCallback(async (actionType: string, metadata: Record<string, any> = {}) => {
    if (!userId) return;

    try {
      const { error } = await supabase.rpc('log_user_action', {
        p_user_id: userId,
        p_action_type: actionType,
        p_metadata: metadata,
      });

      if (error) {
        console.error('log_user_action error:', error);
        return;
      }

      // Invalidate hub cache so streak updates
      queryClient.invalidateQueries({ queryKey: ['daily-hub', userId] });
    } catch (err) {
      console.error('logAction error:', err);
    }
  }, [userId, queryClient]);

  return { logAction };
}
