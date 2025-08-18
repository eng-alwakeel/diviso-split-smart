import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserBehavior } from './useUserBehavior';
import { useSubscription } from './useSubscription';

interface AdPreferences {
  show_ads: boolean;
  preferred_categories: string[];
  blocked_categories: string[];
  max_ads_per_session: number;
  personalized_ads: boolean;
}

interface AdImpression {
  ad_type: string;
  ad_category?: string;
  group_id?: string;
  expense_category?: string;
  placement: string;
  product_id?: string;
  affiliate_partner?: string;
}

export const useAdTracking = () => {
  const [preferences, setPreferences] = useState<AdPreferences | null>(null);
  const [sessionAdCount, setSessionAdCount] = useState(0);
  const { behavior } = useUserBehavior();
  const { subscription } = useSubscription();

  useEffect(() => {
    loadAdPreferences();
  }, []);

  const loadAdPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_ad_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          show_ads: true,
          preferred_categories: [],
          blocked_categories: [],
          max_ads_per_session: !subscription ? 5 : 2,
          personalized_ads: true
        };
        
        await supabase
          .from('user_ad_preferences')
          .insert({ user_id: user.id, ...defaultPrefs });
        
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error loading ad preferences:', error);
    }
  };

  const trackAdImpression = async (adData: AdImpression) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('ad_impressions')
        .insert({
          user_id: user.id,
          ...adData
        });

      setSessionAdCount(prev => prev + 1);
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  const trackAdClick = async (impressionId: string, productId?: string, revenue?: number) => {
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
  };

  const updateAdPreferences = async (newPreferences: Partial<AdPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_ad_preferences')
        .update(newPreferences)
        .eq('user_id', user.id)
        .select()
        .single();

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error updating ad preferences:', error);
    }
  };

  const shouldShowAds = () => {
    if (!preferences) return false;
    if (!preferences.show_ads) return false;
    if (sessionAdCount >= preferences.max_ads_per_session) return false;
    return true;
  };

  const getTargetedCategories = () => {
    if (!behavior || !preferences?.personalized_ads) return [];
    
    const categories = [];
    
    // Based on user behavior patterns
    if (behavior.userType === 'saver') {
      categories.push('finance', 'savings', 'investments');
    } else if (behavior.userType === 'social') {
      categories.push('social', 'entertainment', 'travel');
    } else if (behavior.userType === 'organizer') {
      categories.push('productivity', 'organization', 'business');
    }
    
    // Based on OCR usage
    if (behavior.ocrUsage > 10) {
      categories.push('apps', 'productivity', 'business');
    }
    
    return categories.filter(cat => !preferences.blocked_categories.includes(cat));
  };

  return {
    preferences,
    sessionAdCount,
    shouldShowAds,
    getTargetedCategories,
    trackAdImpression,
    trackAdClick,
    updateAdPreferences,
    loadAdPreferences
  };
};