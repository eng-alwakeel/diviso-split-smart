import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

export interface DailyHubData {
  user_state: 'active' | 'low_activity' | 'new';
  streak_count: number;
  last_action_at: string | null;
  days_since_last_action: number;
  last_group_event: {
    event_type: string;
    smart_message_ar: string;
    smart_message_en: string;
    group_id: string;
    group_name: string;
    created_at: string;
  } | null;
  suggested_dice_type: string | null;
  motivational_message: string | null;
}

const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

async function fetchHubData(userId: string): Promise<DailyHubData> {
  // Try reading from cache first
  const { data: cached } = await supabase
    .from('daily_hub_cache')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If cache exists and is fresh (< 12h), return it
  if (cached?.computed_at) {
    const age = Date.now() - new Date(cached.computed_at).getTime();
    if (age < CACHE_MAX_AGE_MS) {
      return {
        user_state: cached.user_state as DailyHubData['user_state'],
        streak_count: cached.streak_count ?? 0,
        last_action_at: cached.last_action_at,
        days_since_last_action: cached.days_since_last_action ?? 0,
        last_group_event: cached.last_group_event as DailyHubData['last_group_event'],
        suggested_dice_type: cached.suggested_dice_type,
        motivational_message: cached.motivational_message,
      };
    }
  }

  // Cache is stale or doesn't exist → compute
  const { data: computed, error } = await supabase.rpc('compute_daily_hub', {
    p_user_id: userId,
  });

  if (error) {
    console.error('compute_daily_hub error:', error);
    // Return defaults
    return {
      user_state: 'new',
      streak_count: 0,
      last_action_at: null,
      days_since_last_action: 999,
      last_group_event: null,
      suggested_dice_type: null,
      motivational_message: null,
    };
  }

  const result = computed as unknown as DailyHubData;
  return {
    user_state: result.user_state ?? 'new',
    streak_count: result.streak_count ?? 0,
    last_action_at: result.last_action_at ?? null,
    days_since_last_action: result.days_since_last_action ?? 999,
    last_group_event: result.last_group_event ?? null,
    suggested_dice_type: result.suggested_dice_type ?? null,
    motivational_message: result.motivational_message ?? null,
  };
}

export function useDailyHub(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['daily-hub', userId],
    queryFn: () => fetchHubData(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min client-side
    gcTime: 30 * 60 * 1000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['daily-hub', userId] });
  }, [queryClient, userId]);

  return {
    hubData: data ?? null,
    userState: data?.user_state ?? 'new',
    isLoading,
    error,
    refresh,
  };
}
