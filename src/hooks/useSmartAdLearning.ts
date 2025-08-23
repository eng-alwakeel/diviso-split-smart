import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserBehavior } from './useUserBehavior';

interface AdInteraction {
  ad_id: string;
  ad_category: string;
  interaction_type: 'view' | 'click' | 'dismiss' | 'ignore';
  context: string;
  timestamp: string;
  success_score: number; // 0-100 based on interaction quality
}

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

      // Load existing profile or create new one
      const { data: profile } = await supabase
        .from('user_ad_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setAdProfile({
          preferred_categories: profile.preferred_categories || [],
          avoided_categories: profile.avoided_categories || [],
          best_times: profile.best_times || [],
          successful_placements: profile.successful_placements || [],
          click_through_rate: profile.click_through_rate || 0,
          engagement_patterns: profile.engagement_patterns || {
            responds_to_urgency: false,
            prefers_discounts: false,
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
    if (behavior.topExpenseCategories.length > 0) {
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

  const recordAdInteraction = async (interaction: Omit<AdInteraction, 'timestamp' | 'success_score'>) => {
    if (!learningActive || !adProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const successScore = calculateSuccessScore(interaction);
      
      const fullInteraction: AdInteraction = {
        ...interaction,
        timestamp: new Date().toISOString(),
        success_score: successScore
      };

      // Save interaction to database
      await supabase
        .from('ad_interactions')
        .insert({
          user_id: user.id,
          ...fullInteraction
        });

      // Update profile based on interaction
      await updateProfileFromInteraction(fullInteraction);

    } catch (error) {
      console.error('Error recording ad interaction:', error);
    }
  };

  const calculateSuccessScore = (interaction: Omit<AdInteraction, 'timestamp' | 'success_score'>): number => {
    switch (interaction.interaction_type) {
      case 'click':
        return 100;
      case 'view':
        return 30;
      case 'dismiss':
        return -50;
      case 'ignore':
        return -10;
      default:
        return 0;
    }
  };

  const updateProfileFromInteraction = async (interaction: AdInteraction) => {
    if (!adProfile) return;

    const updatedProfile = { ...adProfile };

    if (interaction.success_score > 50) {
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
    } else if (interaction.success_score < -20) {
      // Negative interaction
      if (!updatedProfile.avoided_categories.includes(interaction.ad_category)) {
        updatedProfile.avoided_categories.push(interaction.ad_category);
      }
      
      // Remove from preferred if it was there
      updatedProfile.preferred_categories = updatedProfile.preferred_categories.filter(
        cat => cat !== interaction.ad_category
      );
    }

    // Update CTR
    const { data: allInteractions } = await supabase
      .from('ad_interactions')
      .select('interaction_type')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (allInteractions) {
      const clicks = allInteractions.filter(i => i.interaction_type === 'click').length;
      const views = allInteractions.filter(i => ['view', 'click'].includes(i.interaction_type)).length;
      updatedProfile.click_through_rate = views > 0 ? (clicks / views) * 100 : 0;
    }

    setAdProfile(updatedProfile);
    await saveAdProfile(updatedProfile);
  };

  const saveAdProfile = async (profile: SmartAdProfile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_ad_profiles')
        .upsert({
          user_id: user.id,
          preferred_categories: profile.preferred_categories,
          avoided_categories: profile.avoided_categories,
          best_times: profile.best_times,
          successful_placements: profile.successful_placements,
          click_through_rate: profile.click_through_rate,
          engagement_patterns: profile.engagement_patterns,
          updated_at: new Date().toISOString()
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