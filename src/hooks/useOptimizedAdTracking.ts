import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { throttle } from '@/utils/performanceOptimizations';
import { useAdPreferences } from '@/contexts/AdPreferencesContext';
import { useUserBehavior } from './useUserBehavior';
import { useGlobalSubscription } from './useGlobalSubscription';

interface AdImpression {
  ad_type: string;
  ad_category?: string;
  group_id?: string;
  expense_category?: string;
  placement: string;
  product_id?: string;
  affiliate_partner?: string;
}

export const useOptimizedAdTracking = () => {
  const [sessionAdCount, setSessionAdCount] = useState(0);
  const { preferences } = useAdPreferences();
  const { behavior } = useUserBehavior();
  const { subscription } = useGlobalSubscription();
  
  // Throttled tracking function (max once per 2 seconds)
  const throttledTrackRef = useRef(
    throttle(async (adData: AdImpression, userId: string) => {
      try {
        await supabase
          .from('ad_impressions')
          .insert({
            user_id: userId,
            ...adData
          });
        setSessionAdCount(prev => prev + 1);
      } catch (error) {
        console.error('Error tracking ad impression:', error);
      }
    }, 2000)
  );

  const trackAdImpression = useCallback(async (adData: AdImpression) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      throttledTrackRef.current(adData, user.id);
    } catch (error) {
      console.error('Error in trackAdImpression:', error);
    }
  }, []);

  const trackAdClick = useCallback(async (impressionId: string, productId?: string, revenue?: number) => {
    try {
      await supabase
        .from('ad_impressions')
        .update({
          clicked: true,
          clicked_at: new Date().toISOString(),
          revenue_amount: revenue || 0,
          product_id: productId
        })
        .eq('id', impressionId);
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  }, []);

  const shouldShowAds = useCallback(() => {
    // Priority 1: Paid subscribers don't see ads (by default)
    if (subscription && subscription.status === 'active' && subscription.plan) {
      // For paid users: only show if they explicitly enabled ads
      return preferences?.show_ads === true;
    }

    // Priority 2: Free users MUST see ads
    if (!subscription || !subscription.plan || subscription.status !== 'active') {
      const maxAds = preferences?.max_ads_per_session || 5;
      if (sessionAdCount >= maxAds) return false;
      
      return true;
    }

    // Priority 3: Other states (expired, canceled)
    return false;
  }, [preferences, subscription, sessionAdCount]);

  const getTargetedCategories = useCallback(() => {
    if (!behavior) return [];
    
    const categories = [];
    
    if (behavior.topExpenseCategories && behavior.topExpenseCategories.length > 0) {
      categories.push(...behavior.topExpenseCategories);
    }

    if (behavior.userType === 'saver') {
      categories.push('finance', 'savings', 'investments');
    } else if (behavior.userType === 'social') {
      categories.push('social', 'entertainment', 'travel');
    } else if (behavior.userType === 'organizer') {
      categories.push('productivity', 'organization', 'business');
    }

    return [...new Set(categories)].slice(0, 5);
  }, [behavior]);

  const canDisableAds = useCallback(() => {
    return subscription && subscription.plan && subscription.status === 'active';
  }, [subscription]);

  return {
    preferences,
    sessionAdCount,
    shouldShowAds,
    getTargetedCategories,
    trackAdImpression,
    trackAdClick,
    canDisableAds
  };
};
