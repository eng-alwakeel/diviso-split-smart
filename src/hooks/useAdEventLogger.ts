import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { throttle } from '@/utils/performanceOptimizations';
import { AD_EVENT_TYPES } from '@/lib/adPolicies';

interface AdEventData {
  ad_type: string;
  event_type: keyof typeof AD_EVENT_TYPES | string;
  placement: string;
  partner_id?: string;
  offer_id?: string;
  group_id?: string;
  revenue_amount?: number;
  uc_granted?: number;
  metadata?: Record<string, any>;
}

export function useAdEventLogger() {
  // Throttle impression logging to prevent spam (max once per 2 seconds per ad)
  const throttledLogRef = useRef(
    throttle(async (eventData: AdEventData, userId: string) => {
      try {
        await supabase.from('ad_events').insert({
          user_id: userId,
          ad_type: eventData.ad_type,
          event_type: eventData.event_type,
          placement: eventData.placement,
          partner_id: eventData.partner_id || null,
          offer_id: eventData.offer_id || null,
          group_id: eventData.group_id || null,
          revenue_amount: eventData.revenue_amount || null,
          uc_granted: eventData.uc_granted || null,
          metadata: eventData.metadata || null
        });
      } catch (error) {
        console.error('Error logging ad event:', error);
      }
    }, 2000)
  );

  // Log any ad event
  const logAdEvent = useCallback(async (eventData: AdEventData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For impressions, use throttled logging
      if (eventData.event_type === AD_EVENT_TYPES.IMPRESSION) {
        throttledLogRef.current(eventData, user.id);
      } else {
        // For other events, log immediately
        await supabase.from('ad_events').insert({
          user_id: user.id,
          ad_type: eventData.ad_type,
          event_type: eventData.event_type,
          placement: eventData.placement,
          partner_id: eventData.partner_id || null,
          offer_id: eventData.offer_id || null,
          group_id: eventData.group_id || null,
          revenue_amount: eventData.revenue_amount || null,
          uc_granted: eventData.uc_granted || null,
          metadata: eventData.metadata || null
        });
      }
    } catch (error) {
      console.error('Error in logAdEvent:', error);
    }
  }, []);

  // Convenience methods for common events
  const logImpression = useCallback((
    adType: string,
    placement: string,
    partnerId?: string,
    metadata?: Record<string, any>
  ) => {
    return logAdEvent({
      ad_type: adType,
      event_type: AD_EVENT_TYPES.IMPRESSION,
      placement,
      partner_id: partnerId,
      metadata
    });
  }, [logAdEvent]);

  const logClick = useCallback((
    adType: string,
    placement: string,
    partnerId?: string,
    revenueAmount?: number,
    metadata?: Record<string, any>
  ) => {
    return logAdEvent({
      ad_type: adType,
      event_type: AD_EVENT_TYPES.CLICK,
      placement,
      partner_id: partnerId,
      revenue_amount: revenueAmount,
      metadata
    });
  }, [logAdEvent]);

  const logRewardedStart = useCallback((placement: string, groupId?: string) => {
    return logAdEvent({
      ad_type: 'rewarded',
      event_type: AD_EVENT_TYPES.START,
      placement,
      group_id: groupId
    });
  }, [logAdEvent]);

  const logRewardedComplete = useCallback((
    placement: string, 
    ucGranted: number,
    groupId?: string
  ) => {
    return logAdEvent({
      ad_type: 'rewarded',
      event_type: AD_EVENT_TYPES.COMPLETE,
      placement,
      uc_granted: ucGranted,
      group_id: groupId
    });
  }, [logAdEvent]);

  const logRewardedClaim = useCallback((
    placement: string,
    ucGranted: number,
    groupId?: string
  ) => {
    return logAdEvent({
      ad_type: 'rewarded',
      event_type: AD_EVENT_TYPES.CLAIM,
      placement,
      uc_granted: ucGranted,
      group_id: groupId
    });
  }, [logAdEvent]);

  const logDismiss = useCallback((
    adType: string,
    placement: string,
    metadata?: Record<string, any>
  ) => {
    return logAdEvent({
      ad_type: adType,
      event_type: AD_EVENT_TYPES.DISMISS,
      placement,
      metadata
    });
  }, [logAdEvent]);

  const logError = useCallback((
    adType: string,
    placement: string,
    errorMessage: string
  ) => {
    return logAdEvent({
      ad_type: adType,
      event_type: AD_EVENT_TYPES.ERROR,
      placement,
      metadata: { error: errorMessage }
    });
  }, [logAdEvent]);

  const logOutboundClick = useCallback((
    adType: string,
    placement: string,
    partnerId: string,
    productId?: string,
    affiliateUrl?: string
  ) => {
    return logAdEvent({
      ad_type: adType,
      event_type: AD_EVENT_TYPES.OUTBOUND_CLICK,
      placement,
      partner_id: partnerId,
      metadata: { product_id: productId, affiliate_url: affiliateUrl }
    });
  }, [logAdEvent]);

  return {
    logAdEvent,
    logImpression,
    logClick,
    logRewardedStart,
    logRewardedComplete,
    logRewardedClaim,
    logDismiss,
    logError,
    logOutboundClick
  };
}
