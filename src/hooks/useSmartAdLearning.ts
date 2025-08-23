import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserBehavior } from './useUserBehavior';

interface SmartAdProfile {
  preferred_categories: string[];
  avoided_categories: string[];
  best_times: string[];
  successful_placements: string[];
  click_through_rate: number;
  engagement_patterns: {
    responds_to_urgency: boolean;
    prefers_discounts: boolean;
    likes_premium_products: boolean;
    responds_to_social_proof: boolean;
  };
}

export const useSmartAdLearning = () => {
  const [adProfile, setAdProfile] = useState<SmartAdProfile | null>(null);
  const [learningActive, setLearningActive] = useState(true);
  const { behavior } = useUserBehavior();

  useEffect(() => {
    loadAdProfile();
  }, []);

  useEffect(() => {
    if (behavior) {
      updateProfileFromBehavior();
    }
  }, [behavior]);

  const loadAdProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load existing profile from user_ad_preferences (using existing table)
      const { data: preferences } = await supabase
        .from('user_ad_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferences) {
        setAdProfile({
          preferred_categories: preferences.preferred_categories || [],
          avoided_categories: preferences.blocked_categories || [],
          best_times: ['evening'], // Default
          successful_placements: [],
          click_through_rate: 0,
          engagement_patterns: {
            responds_to_urgency: false,
            prefers_discounts: preferences.personalized_ads,
            likes_premium_products: false,
            responds_to_social_proof: false,
          }
        });
      } else {
        // Create initial profile
        const initialProfile = createInitialProfile();
        await saveAdProfile(initialProfile);
        setAdProfile(initialProfile);
      }
    } catch (error) {
      console.error('Error loading ad profile:', error);
    }
  };

  const createInitialProfile = (): SmartAdProfile => {
    return {
      preferred_categories: [],
      avoided_categories: [],
      best_times: ['evening'], // Default assumption
      successful_placements: [],
      click_through_rate: 0,
      engagement_patterns: {
        responds_to_urgency: false,
        prefers_discounts: true, // Most users like discounts
        likes_premium_products: false,
        responds_to_social_proof: false,
      }
    };
  };

  const updateProfileFromBehavior = () => {
    if (!behavior || !adProfile) return;

    const updatedProfile = { ...adProfile };

    // Update categories based on expense patterns
    if (behavior.topExpenseCategories && behavior.topExpenseCategories.length > 0) {
      behavior.topExpenseCategories.forEach(category => {
        if (!updatedProfile.preferred_categories.includes(category)) {
          updatedProfile.preferred_categories.push(category);
        }
      });
    }

    // Update timing preferences
    if (behavior.preferredUsageTime && !updatedProfile.best_times.includes(behavior.preferredUsageTime)) {
      updatedProfile.best_times = [behavior.preferredUsageTime];
    }

    // Update engagement patterns based on behavior
    if (behavior.userType === 'saver') {
      updatedProfile.engagement_patterns.prefers_discounts = true;
      updatedProfile.engagement_patterns.likes_premium_products = false;
    } else if (behavior.userType === 'organizer') {
      updatedProfile.engagement_patterns.likes_premium_products = true;
      updatedProfile.engagement_patterns.responds_to_social_proof = true;
    } else if (behavior.userType === 'social') {
      updatedProfile.engagement_patterns.responds_to_social_proof = true;
    }

    setAdProfile(updatedProfile);
  };

  const recordAdInteraction = async (adData: { ad_type: string; ad_category: string; context: string; interaction_type: 'view' | 'click' | 'dismiss' | 'ignore' }) => {
    if (!learningActive || !adProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use ad_impressions table to track interactions (simplified)
      await supabase
        .from('ad_impressions')
        .insert({
          user_id: user.id,
          ad_type: adData.ad_type,
          ad_category: adData.ad_category,
          placement: adData.context,
          clicked: adData.interaction_type === 'click'
        });

      // Update profile based on interaction
      await updateProfileFromInteraction(adData);

    } catch (error) {
      console.error('Error recording ad interaction:', error);
    }
  };

  const updateProfileFromInteraction = async (interaction: { ad_type: string; ad_category: string; context: string; interaction_type: 'view' | 'click' | 'dismiss' | 'ignore' }) => {
    if (!adProfile) return;

    const updatedProfile = { ...adProfile };
    const successScore = interaction.interaction_type === 'click' ? 100 : 
                        interaction.interaction_type === 'view' ? 30 :
                        interaction.interaction_type === 'dismiss' ? -50 : -10;

    if (successScore > 50) {
      // Positive interaction
      if (!updatedProfile.preferred_categories.includes(interaction.ad_category)) {
        updatedProfile.preferred_categories.push(interaction.ad_category);
      }
      if (!updatedProfile.successful_placements.includes(interaction.context)) {
        updatedProfile.successful_placements.push(interaction.context);
      }
      
      // Remove from avoided if it was there
      updatedProfile.avoided_categories = updatedProfile.avoided_categories.filter(
        cat => cat !== interaction.ad_category
      );
    } else if (successScore < -20) {
      // Negative interaction
      if (!updatedProfile.avoided_categories.includes(interaction.ad_category)) {
        updatedProfile.avoided_categories.push(interaction.ad_category);
      }
      
      // Remove from preferred if it was there
      updatedProfile.preferred_categories = updatedProfile.preferred_categories.filter(
        cat => cat !== interaction.ad_category
      );
    }

    setAdProfile(updatedProfile);
    await saveAdProfile(updatedProfile);
  };

  const saveAdProfile = async (profile: SmartAdProfile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user_ad_preferences with new data
      await supabase
        .from('user_ad_preferences')
        .upsert({
          user_id: user.id,
          preferred_categories: profile.preferred_categories,
          blocked_categories: profile.avoided_categories,
          personalized_ads: profile.engagement_patterns.prefers_discounts,
          show_ads: true,
          max_ads_per_session: 5
        });
    } catch (error) {
      console.error('Error saving ad profile:', error);
    }
  };

  const getSmartAdRecommendations = (context: string, availableCategories: string[]) => {
    if (!adProfile) return availableCategories;

    // Filter out avoided categories
    let recommended = availableCategories.filter(
      cat => !adProfile.avoided_categories.includes(cat)
    );

    // Prioritize preferred categories
    const preferred = recommended.filter(cat => adProfile.preferred_categories.includes(cat));
    const others = recommended.filter(cat => !adProfile.preferred_categories.includes(cat));

    return [...preferred, ...others];
  };

  const shouldShowAdInContext = (context: string): boolean => {
    if (!adProfile) return true;
    
    // Don't show ads in contexts that haven't been successful
    if (adProfile.successful_placements.length > 0) {
      return adProfile.successful_placements.includes(context);
    }

    return true;
  };

  const getOptimalAdTiming = (): boolean => {
    if (!adProfile) return true;

    const currentHour = new Date().getHours();
    const currentTimeSlot = 
      currentHour >= 6 && currentHour < 12 ? 'morning' :
      currentHour >= 12 && currentHour < 17 ? 'afternoon' :
      currentHour >= 17 && currentHour < 22 ? 'evening' : 'night';

    return adProfile.best_times.includes(currentTimeSlot);
  };

  return {
    adProfile,
    learningActive,
    recordAdInteraction,
    getSmartAdRecommendations,
    shouldShowAdInContext,
    getOptimalAdTiming,
    setLearningActive
  };
};