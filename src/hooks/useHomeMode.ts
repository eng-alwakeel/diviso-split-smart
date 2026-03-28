import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildUserDataProfile, resolveHomeMode } from '@/services/homeModeEngine';
import { buildGuestDataProfile } from '@/services/homeModeEngine/guestProfileBuilder';
import { isGuestSession } from '@/services/guestSession/guestSessionManager';
import type { HomeModeResult } from '@/services/homeModeEngine';

export function useHomeMode() {
  const { data: authState, isLoading: authLoading } = useQuery({
    queryKey: ['home-mode-auth'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id ?? null;
      return { userId, isGuest: !userId && isGuestSession() };
    },
    staleTime: 60 * 1000,
  });

  const userId = authState?.userId ?? null;
  const isGuest = authState?.isGuest ?? false;

  const { data: profile, isLoading: profileLoading, refetch } = useQuery({
    queryKey: ['home-mode-profile', userId, isGuest],
    queryFn: () => {
      if (userId) return buildUserDataProfile(userId);
      if (isGuest) return buildGuestDataProfile();
      return null;
    },
    enabled: !!userId || isGuest,
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
    isLoading: authLoading || profileLoading,
    isGuest,
    refresh: refetch,
  };
}
