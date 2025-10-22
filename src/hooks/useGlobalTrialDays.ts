import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

const TRIAL_DAYS_QUERY_KEY = ['remaining-trial-days'];

// Centralized trial days fetcher
async function fetchRemainingTrialDays(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 7; // Default trial days

  const { data, error } = await supabase
    .rpc('get_remaining_trial_days', { p_user_id: user.id });

  if (error) {
    console.error('Error fetching trial days:', error);
    return 7; // Fallback to default
  }

  return data ?? 7;
}

// Global trial days hook using React Query
export function useGlobalTrialDays() {
  const queryClient = useQueryClient();

  const {
    data: remainingTrialDays,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: TRIAL_DAYS_QUERY_KEY,
    queryFn: fetchRemainingTrialDays,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    enabled: true, // Always enabled, returns default safely if no user
    throwOnError: false // Don't throw errors, return them in error state
  });

  // Invalidate cache when needed
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: TRIAL_DAYS_QUERY_KEY });
  }, [queryClient]);

  return {
    remainingTrialDays: remainingTrialDays ?? 7,
    loading,
    error,
    refetch,
    invalidate
  };
}
