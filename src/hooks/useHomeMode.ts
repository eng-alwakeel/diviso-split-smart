import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildUserDataProfile, resolveHomeMode } from '@/services/homeModeEngine';
import type { HomeModeResult } from '@/services/homeModeEngine';

export function useHomeMode() {
  const { data: userId } = useQuery({
    queryKey: ['home-mode-uid'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user?.id ?? null;
    },
    staleTime: 60 * 1000,
  });

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['home-mode-profile', userId],
    queryFn: () => buildUserDataProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const result: HomeModeResult | null = useMemo(() => {
    if (!profile) return null;
    const r = resolveHomeMode(profile);
    if (import.meta.env.DEV) {
      console.log('[HomeMode]', r.resolution_reason, r);
    }
    return r;
  }, [profile]);

  return {
    result,
    isLoading: !userId || isLoading,
    refresh: refetch,
  };
}
