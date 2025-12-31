import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for tracking referral milestones and granting bonuses
 * Used to notify the system when an invitee completes certain actions
 */
export function useReferralProgress() {
  /**
   * Notify that the current user completed their first usage (expense)
   * Grants 10 RP to the inviter
   */
  const notifyFirstUsage = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('grant_referral_first_usage_bonus', {
        p_invitee_id: user.id
      });

      if (error) {
        // Not an error if no pending referral - user might not be referred
        console.log('First usage bonus check:', error.message);
        return false;
      }

      const result = data as { success: boolean; milestone?: string; points_granted?: number };
      if (result?.success) {
        console.log('First usage bonus granted to inviter');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error notifying first usage:', error);
      return false;
    }
  }, []);

  /**
   * Notify that the current user completed a milestone (group creation or settlement)
   * Grants 20 RP to the inviter
   */
  const notifyMilestone = useCallback(async (
    milestoneType: 'group' | 'settlement'
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('grant_referral_milestone_bonus', {
        p_invitee_id: user.id,
        p_milestone_type: milestoneType
      });

      if (error) {
        console.log('Milestone bonus check:', error.message);
        return false;
      }

      const result = data as { success: boolean; milestone?: string; points_granted?: number };
      if (result?.success) {
        console.log(`Milestone ${milestoneType} bonus granted to inviter`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error notifying milestone:', error);
      return false;
    }
  }, []);

  /**
   * Get the current user's referral progress (as inviter)
   */
  const getMyReferralProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('referral_progress')
        .select('*')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referral progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMyReferralProgress:', error);
      return [];
    }
  }, []);

  return {
    notifyFirstUsage,
    notifyMilestone,
    getMyReferralProgress
  };
}
