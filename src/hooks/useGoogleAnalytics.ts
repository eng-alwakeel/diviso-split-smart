import { useCallback } from 'react';

/**
 * Hook for Google Analytics 4 tracking via GTM dataLayer
 * GTM Container: GTM-N8L66CCR
 * GA4 Measurement ID: G-HB3NHRL0GT
 */
export function useGoogleAnalytics() {
  const trackEvent = useCallback((
    eventName: string,
    params?: Record<string, unknown>
  ) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...params
      });
    }
  }, []);

  // Authentication Events
  const trackSignup = useCallback((method: string) => {
    trackEvent('sign_up', { method });
  }, [trackEvent]);

  const trackLogin = useCallback((method: string) => {
    trackEvent('login', { method });
  }, [trackEvent]);

  const trackLogout = useCallback(() => {
    trackEvent('logout');
  }, [trackEvent]);

  // CTA & Feature Events
  const trackClickCTA = useCallback((ctaName: string, location: string) => {
    trackEvent('click_cta', { cta_name: ctaName, location });
  }, [trackEvent]);

  const trackViewFeature = useCallback((featureName: string) => {
    trackEvent('view_feature', { feature_name: featureName });
  }, [trackEvent]);

  // Page View for SPA navigation
  const trackPageView = useCallback((pagePath: string, pageTitle: string) => {
    trackEvent('page_view', { 
      page_path: pagePath, 
      page_title: pageTitle,
      page_location: window.location.href
    });
  }, [trackEvent]);

  // Track UTM parameters
  const trackWithUTM = useCallback((eventName: string, additionalParams?: Record<string, unknown>) => {
    const urlParams = new URLSearchParams(window.location.search);
    trackEvent(eventName, {
      ...additionalParams,
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
    });
  }, [trackEvent]);

  // User Properties
  const setUserProperties = useCallback((userId: string, isPaid: boolean, plan?: string) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'user_properties_set',
        user_id: userId,
        user_type: isPaid ? 'paid' : 'free',
        subscription_plan: plan || 'none'
      });
    }
  }, []);

  // Conversion Events
  const trackGroupCreated = useCallback(() => {
    trackEvent('group_created');
  }, [trackEvent]);

  const trackExpenseAdded = useCallback((amount: number, currency: string) => {
    trackEvent('expense_added', { value: amount, currency });
  }, [trackEvent]);

  const trackSubscriptionStarted = useCallback((plan: string, value: number) => {
    trackEvent('subscription_started', { plan, value, currency: 'SAR' });
  }, [trackEvent]);

  const trackCreditsPurchased = useCallback((credits: number, value: number) => {
    trackEvent('credits_purchased', { credits, value, currency: 'SAR' });
  }, [trackEvent]);

  const trackPaywallViewed = useCallback((source: string) => {
    trackEvent('paywall_viewed', { source });
  }, [trackEvent]);

  // Track Core Web Vitals
  const trackWebVitals = useCallback((metricName: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
    trackEvent('web_vitals', { 
      metric_name: metricName,
      metric_value: Math.round(metricName === 'CLS' ? value * 1000 : value),
      metric_rating: rating
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackSignup,
    trackLogin,
    trackLogout,
    trackClickCTA,
    trackViewFeature,
    trackPageView,
    trackWithUTM,
    setUserProperties,
    trackGroupCreated,
    trackExpenseAdded,
    trackSubscriptionStarted,
    trackCreditsPurchased,
    trackPaywallViewed,
    trackWebVitals
  };
}

/**
 * Standalone function for tracking events outside of React components
 */
export function trackGAEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params
    });
  }
}
