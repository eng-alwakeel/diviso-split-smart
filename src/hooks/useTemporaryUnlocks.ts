import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export type FeatureType = 'advanced_analytics' | 'ai_insight' | 'template' | 'ocr_boost' | 'export';

interface TemporaryUnlock {
  id: string;
  featureType: FeatureType;
  restrictions: Record<string, unknown>;
  grantedAt: string;
  expiresAt: string;
  source: string;
  isUsed: boolean;
  usedAt: string | null;
  remainingDays: number;
  remainingHours: number;
}

interface GrantResult {
  success: boolean;
  unlock_id?: string;
  feature_type?: string;
  expires_at?: string;
  error?: string;
}

export const useTemporaryUnlocks = () => {
  const [unlocks, setUnlocks] = useState<TemporaryUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnlocks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('temporary_unlocks')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (error) throw error;

      const now = new Date();
      setUnlocks(data?.map(u => {
        const expiresAt = new Date(u.expires_at);
        const diffMs = expiresAt.getTime() - now.getTime();
        const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const diffDays = Math.floor(diffHours / 24);

        return {
          id: u.id,
          featureType: u.feature_type as FeatureType,
          restrictions: (u.restrictions as Record<string, unknown>) ?? {},
          grantedAt: u.granted_at,
          expiresAt: u.expires_at,
          source: u.source,
          isUsed: u.is_used ?? false,
          usedAt: u.used_at,
          remainingDays: diffDays,
          remainingHours: diffHours % 24
        };
      }) ?? []);
    } catch (error) {
      console.error('Error fetching temporary unlocks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasActiveUnlock = useCallback((featureType: FeatureType): boolean => {
    return unlocks.some(u => 
      u.featureType === featureType && 
      new Date(u.expiresAt) > new Date()
    );
  }, [unlocks]);

  const getActiveUnlock = useCallback((featureType: FeatureType): TemporaryUnlock | null => {
    return unlocks.find(u => 
      u.featureType === featureType && 
      new Date(u.expiresAt) > new Date()
    ) ?? null;
  }, [unlocks]);

  const getRestrictions = useCallback((featureType: FeatureType): Record<string, unknown> | null => {
    const unlock = getActiveUnlock(featureType);
    return unlock?.restrictions ?? null;
  }, [getActiveUnlock]);

  const markAsUsed = useCallback(async (unlockId: string) => {
    try {
      const { error } = await supabase
        .from('temporary_unlocks')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', unlockId);

      if (error) throw error;

      setUnlocks(prev => prev.map(u => 
        u.id === unlockId ? { ...u, isUsed: true, usedAt: new Date().toISOString() } : u
      ));

      return { success: true };
    } catch (error) {
      console.error('Error marking unlock as used:', error);
      return { success: false };
    }
  }, []);

  const grantUnlock = useCallback(async (
    featureType: FeatureType,
    durationDays: number,
    source: string,
    restrictions: Record<string, unknown> = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'not_authenticated' };

      const { data, error } = await supabase.rpc('grant_temporary_unlock', {
        p_user_id: user.id,
        p_feature_type: featureType,
        p_duration_days: durationDays,
        p_source: source,
        p_restrictions: restrictions as Json
      });

      if (error) throw error;

      await fetchUnlocks();
      return data as unknown as GrantResult;
    } catch (error) {
      console.error('Error granting unlock:', error);
      return { success: false, error: 'grant_failed' };
    }
  }, [fetchUnlocks]);

  const getRemainingTime = useCallback((featureType: FeatureType): string | null => {
    const unlock = getActiveUnlock(featureType);
    if (!unlock) return null;

    if (unlock.remainingDays > 0) {
      return `${unlock.remainingDays} ${unlock.remainingDays === 1 ? 'يوم' : 'أيام'}`;
    } else if (unlock.remainingHours > 0) {
      return `${unlock.remainingHours} ${unlock.remainingHours === 1 ? 'ساعة' : 'ساعات'}`;
    }
    return 'أقل من ساعة';
  }, [getActiveUnlock]);

  useEffect(() => {
    fetchUnlocks();

    // تحديث كل 5 دقائق
    const interval = setInterval(fetchUnlocks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUnlocks]);

  return {
    unlocks,
    loading,
    hasActiveUnlock,
    getActiveUnlock,
    getRestrictions,
    getRemainingTime,
    markAsUsed,
    grantUnlock,
    refetch: fetchUnlocks
  };
};
