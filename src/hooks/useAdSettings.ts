import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  DEFAULT_REWARDED_SETTINGS, 
  DEFAULT_SPONSORED_SETTINGS,
  DEFAULT_NATIVE_SETTINGS,
  DEFAULT_BANNER_SETTINGS,
  ENABLE_ADS 
} from '@/lib/adPolicies';

interface AdType {
  id: string;
  type_key: string;
  name: string;
  name_ar: string;
  is_enabled: boolean;
  settings: Record<string, any> | null;
}

interface AdPlacement {
  id: string;
  placement_key: string;
  name: string;
  name_ar: string;
  is_enabled: boolean;
  allowed_ad_types: string[] | null;
  max_impressions_per_user_day: number | null;
  min_interval_seconds: number | null;
  targeting: Record<string, any> | null;
}

export function useAdSettings() {
  // Fetch ad types from database
  const { data: adTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['ad-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_types')
        .select('*')
        .order('type_key');
      
      if (error) throw error;
      return data as AdType[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch ad placements from database
  const { data: adPlacements, isLoading: placementsLoading } = useQuery({
    queryKey: ['ad-placements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_placements')
        .select('*')
        .order('placement_key');
      
      if (error) throw error;
      return data as AdPlacement[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Check if an ad type is enabled
  const isAdTypeEnabled = useCallback((typeKey: string): boolean => {
    if (!ENABLE_ADS) return false;
    
    const adType = adTypes?.find(t => t.type_key === typeKey);
    return adType?.is_enabled ?? false;
  }, [adTypes]);

  // Check if a placement is enabled
  const isPlacementEnabled = useCallback((placementKey: string): boolean => {
    if (!ENABLE_ADS) return false;
    
    const placement = adPlacements?.find(p => p.placement_key === placementKey);
    return placement?.is_enabled ?? false;
  }, [adPlacements]);

  // Check if a specific ad type is allowed at a specific placement
  const isAdAllowedAtPlacement = useCallback((typeKey: string, placementKey: string): boolean => {
    if (!ENABLE_ADS) return false;
    
    const adType = adTypes?.find(t => t.type_key === typeKey);
    const placement = adPlacements?.find(p => p.placement_key === placementKey);
    
    if (!adType?.is_enabled || !placement?.is_enabled) return false;
    
    // If placement has allowed_ad_types, check if this type is in the list
    if (placement.allowed_ad_types && placement.allowed_ad_types.length > 0) {
      return placement.allowed_ad_types.includes(typeKey);
    }
    
    // Otherwise, allow all enabled types
    return true;
  }, [adTypes, adPlacements]);

  // Get settings for an ad type
  const getAdTypeSettings = useCallback((typeKey: string): Record<string, any> => {
    const adType = adTypes?.find(t => t.type_key === typeKey);
    
    if (adType?.settings) {
      return adType.settings;
    }
    
    // Return defaults based on type
    switch (typeKey) {
      case 'rewarded':
        return DEFAULT_REWARDED_SETTINGS;
      case 'sponsored':
        return DEFAULT_SPONSORED_SETTINGS;
      case 'native':
        return DEFAULT_NATIVE_SETTINGS;
      case 'banner':
        return DEFAULT_BANNER_SETTINGS;
      default:
        return {};
    }
  }, [adTypes]);

  // Get placement settings
  const getPlacementSettings = useCallback((placementKey: string): AdPlacement | null => {
    return adPlacements?.find(p => p.placement_key === placementKey) || null;
  }, [adPlacements]);

  // Get rewarded ad settings specifically
  const getRewardedSettings = useCallback(() => {
    const settings = getAdTypeSettings('rewarded');
    return {
      rewardUC: settings.reward_uc ?? DEFAULT_REWARDED_SETTINGS.reward_uc,
      dailyCap: settings.daily_cap ?? DEFAULT_REWARDED_SETTINGS.daily_cap,
      cooldownSeconds: settings.cooldown_seconds ?? DEFAULT_REWARDED_SETTINGS.cooldown_seconds,
      validityType: settings.validity_type ?? DEFAULT_REWARDED_SETTINGS.validity_type
    };
  }, [getAdTypeSettings]);

  return {
    adTypes,
    adPlacements,
    isLoading: typesLoading || placementsLoading,
    isAdTypeEnabled,
    isPlacementEnabled,
    isAdAllowedAtPlacement,
    getAdTypeSettings,
    getPlacementSettings,
    getRewardedSettings
  };
}
