import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { throttle } from '@/utils/performanceOptimizations';
import { useAdPreferences } from '@/contexts/AdPreferencesContext';
import { useUserBehavior } from './useUserBehavior';
import { useGlobalSubscription } from './useGlobalSubscription';
import { useAdSettings } from './useAdSettings';
import { useAdEventLogger } from './useAdEventLogger';
import { ENABLE_ADS, AD_TYPES, getUserAdRules } from '@/lib/adPolicies';

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
  const { isAdTypeEnabled, isPlacementEnabled, isAdAllowedAtPlacement } = useAdSettings();
  const { logImpression, logClick } = useAdEventLogger();
  
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

      // Track in ad_impressions (legacy)
      throttledTrackRef.current(adData, user.id);
      
      // Also log to ad_events for new analytics
      await logImpression(adData.ad_type, adData.placement, adData.affiliate_partner, {
        ad_category: adData.ad_category,
        expense_category: adData.expense_category,
        product_id: adData.product_id
      });
    } catch (error) {
      console.error('Error in trackAdImpression:', error);
    }
  }, [logImpression]);

  const trackAdClick = useCallback(async (impressionId: string, productId?: string, revenue?: number) => {
    try {
      // Update legacy ad_impressions
      if (impressionId && impressionId !== 'temp-id') {
        await supabase
          .from('ad_impressions')
          .update({
            clicked: true,
            clicked_at: new Date().toISOString(),
            revenue_amount: revenue || 0,
            product_id: productId
          })
          .eq('id', impressionId);
      }
      
      // Log to ad_events
      await logClick('sponsored', 'context', undefined, revenue, { product_id: productId });
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  }, [logClick]);

  const shouldShowAds = useCallback((adType?: string, placement?: string) => {
    // Master switch
    if (!ENABLE_ADS) return false;
    
    // Check ad type and placement if provided
    if (adType && !isAdTypeEnabled(adType)) return false;
    if (placement && !isPlacementEnabled(placement)) return false;
    if (adType && placement && !isAdAllowedAtPlacement(adType, placement)) return false;

    // Determine user type
    const isPaid = subscription && subscription.status === 'active' && subscription.plan;
    const userType = isPaid ? 'paid' : 'free';
    const rules = getUserAdRules(userType);

    // Priority 1: Paid subscribers don't see network ads (by default)
    if (isPaid) {
      // For paid users: only show if they explicitly enabled ads
      if (adType === AD_TYPES.NATIVE || adType === AD_TYPES.BANNER) {
        return preferences?.show_ads === true;
      }
      // Sponsored/affiliate can still show for paid users (useful recommendations)
      if (adType === AD_TYPES.SPONSORED) {
        return rules.see_sponsored;
      }
      // Rewarded not needed for paid users
      if (adType === AD_TYPES.REWARDED) {
        return false;
      }
    }

    // Priority 2: Free users MUST see ads
    if (!isPaid) {
      const maxAds = preferences?.max_ads_per_session || 5;
      if (sessionAdCount >= maxAds) return false;
      
      return true;
    }

    return false;
  }, [preferences, subscription, sessionAdCount, isAdTypeEnabled, isPlacementEnabled, isAdAllowedAtPlacement]);

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
    canDisableAds,
    isAdTypeEnabled,
    isPlacementEnabled
  };
};
