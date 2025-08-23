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
    if (!preferences) return true; // Default to showing ads for better user experience
    if (!preferences.show_ads) return false;
    if (sessionAdCount >= preferences.max_ads_per_session) return false;

    // Smart timing: only show ads during user's preferred usage times
    if (behavior?.preferredUsageTime) {
      const currentHour = new Date().getHours();
      const currentTimeSlot = 
        currentHour >= 6 && currentHour < 12 ? 'morning' :
        currentHour >= 12 && currentHour < 17 ? 'afternoon' :
        currentHour >= 17 && currentHour < 22 ? 'evening' : 'night';
      
      // Show ads more frequently during user's active time
      if (currentTimeSlot !== behavior.preferredUsageTime && sessionAdCount >= 2) {
        return false;
      }
    }

    // Don't overwhelm high-engagement users
    if (behavior?.engagementLevel === 'high' && sessionAdCount >= 3) {
      return false;
    }

    return true;
  };

  const getTargetedCategories = () => {
    if (!behavior) return [];
    
    const categories = [];
    
    // Enhanced targeting based on behavior
    if (behavior.topExpenseCategories && behavior.topExpenseCategories.length > 0) {
      categories.push(...behavior.topExpenseCategories);
    }

    // Based on user type with enhanced logic
    if (behavior.userType === 'saver') {
      categories.push('finance', 'savings', 'investments', 'budgeting-tools');
      if (behavior.averageExpenseAmount < 100) {
        categories.push('discount', 'affordable');
      }
    } else if (behavior.userType === 'social') {
      categories.push('social', 'entertainment', 'travel', 'dining');
      if (behavior.groupUsage > 3) {
        categories.push('group-activities', 'team-tools');
      }
    } else if (behavior.userType === 'organizer') {
      categories.push('productivity', 'organization', 'business', 'premium-tools');
      if (behavior.clickThroughPatterns.reportViews > 5) {
        categories.push('analytics', 'reporting');
      }
    }
    
    // Based on financial goals
    switch (behavior.financialGoals) {
      case 'budgeting':
        categories.push('budgeting', 'financial-planning');
        break;
      case 'analysis':
        categories.push('analytics', 'reporting', 'insights');
        break;
      case 'group_management':
        categories.push('collaboration', 'group-tools');
        break;
    }

    // Based on OCR usage patterns
    if (behavior.ocrUsage > 10) {
      categories.push('apps', 'productivity', 'business', 'scanning-tools');
    }

    // Device-specific categories
    if (behavior.devicePreference === 'mobile') {
      categories.push('mobile-apps', 'on-the-go');
    }

    // Remove duplicates and limit to top categories
    return [...new Set(categories)].slice(0, 5);
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