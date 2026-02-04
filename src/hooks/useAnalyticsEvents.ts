import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventCategory = 'engagement' | 'monetization' | 'retention' | 'growth' | 'system';

interface EventData {
  [key: string]: any;
}

const EVENT_CATEGORIES: Record<string, EventCategory> = {
  // Engagement events
  signup_completed: 'engagement',
  group_created: 'engagement',
  expense_added: 'engagement',
  settlement_completed: 'engagement',
  ai_receipt_scan: 'engagement',
  report_generated: 'engagement',
  export_done: 'engagement',
  daily_checkin: 'engagement',
  app_opened: 'engagement',
  
  // Dice Decision events
  dice_opened: 'engagement',
  dice_rolled: 'engagement',
  dice_dual_rolled: 'engagement',
  dice_rerolled: 'engagement',
  decision_accepted: 'engagement',
  dice_shared: 'growth',
  split_started_after_dice: 'engagement',
  
  // Dice Chat events
  dice_posted_to_chat: 'engagement',
  dice_vote_cast: 'engagement',
  dice_accepted_in_chat: 'engagement',
  dice_rerolled_in_chat: 'engagement',
  split_started_from_dice_chat: 'engagement',
  
  // Monetization events
  credits_spent: 'monetization',
  credits_granted: 'monetization',
  paywall_viewed: 'monetization',
  subscription_started: 'monetization',
  subscription_canceled: 'monetization',
  credits_pack_purchased: 'monetization',
  
  // Growth events
  invite_sent: 'growth',
  invite_activated: 'growth',
  referral_completed: 'growth',
  
  // Retention events
  recommendation_viewed: 'retention',
  recommendation_clicked: 'retention',
  recommendation_saved: 'retention',
  
  // System events
  error_occurred: 'system',
  feature_used: 'system',
};

const getCategory = (eventName: string): EventCategory => {
  return EVENT_CATEGORIES[eventName] || 'system';
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

export function useAnalyticsEvents() {
  const trackEvent = useCallback(async (
    eventName: string, 
    eventData?: EventData
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        event_name: eventName,
        event_category: getCategory(eventName),
        event_data: eventData || {},
        session_id: getSessionId(),
        device_type: getDeviceType(),
      });

      if (error) {
        console.error('Error tracking event:', error);
      }
    } catch (err) {
      // Silently fail - analytics shouldn't break the app
      console.error('Analytics tracking error:', err);
    }
  }, []);

  const trackPageView = useCallback(async (pageName: string): Promise<void> => {
    await trackEvent('page_viewed', { page: pageName });
  }, [trackEvent]);

  const trackFeatureUsed = useCallback(async (featureName: string, metadata?: EventData): Promise<void> => {
    await trackEvent('feature_used', { feature: featureName, ...metadata });
  }, [trackEvent]);

  const trackCreditsSpent = useCallback(async (
    actionType: string, 
    amount: number, 
    metadata?: EventData
  ): Promise<void> => {
    await trackEvent('credits_spent', { action_type: actionType, amount, ...metadata });
  }, [trackEvent]);

  const trackPaywallViewed = useCallback(async (blockedAction: string): Promise<void> => {
    await trackEvent('paywall_viewed', { action_blocked: blockedAction });
  }, [trackEvent]);

  return { 
    trackEvent, 
    trackPageView, 
    trackFeatureUsed,
    trackCreditsSpent,
    trackPaywallViewed
  };
}

// Standalone function for use outside React components
export async function trackAnalyticsEvent(
  eventName: string, 
  eventData?: EventData
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_name: eventName,
      event_category: getCategory(eventName),
      event_data: eventData || {},
      session_id: getSessionId(),
      device_type: getDeviceType(),
    });
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
}
