import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdEligibility {
  canWatch: boolean;
  adsEnabled: boolean;
  dailyCap: number;
  currentCount: number;
  remainingToday: number;
  cooldownRemaining: number;
  availableCredits: number;
  requiredUC: number;
  neededUC: number;
  adsNeeded: number;
}

interface AdSession {
  sessionId: string;
  neededUC: number;
  rewardUC: number;
}

interface ClaimResult {
  success: boolean;
  rewardUC?: number;
  alreadyClaimed?: boolean;
  error?: string;
}

interface TokenClaimResult {
  success: boolean;
  tokenId?: string;
  expiresInMinutes?: number;
  error?: string;
}

// Type for RPC response
interface EligibilityResponse {
  can_watch?: boolean;
  ads_enabled?: boolean;
  daily_cap?: number;
  current_count?: number;
  remaining_today?: number;
  cooldown_remaining?: number;
  available_credits?: number;
  required_uc?: number;
  needed_uc?: number;
  ads_needed?: number;
}

interface SessionResponse {
  success?: boolean;
  error?: string;
  session_id?: string;
  needed_uc?: number;
  reward_uc?: number;
}

interface ClaimResponse {
  success?: boolean;
  error?: string;
  reward_uc?: number;
  already_claimed?: boolean;
}

interface TokenResponse {
  success?: boolean;
  error?: string;
  token_id?: string;
  expires_in_minutes?: number;
}

export function useRewardedAds() {
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<AdEligibility | null>(null);
  const [currentSession, setCurrentSession] = useState<AdSession | null>(null);

  // Check if user can watch a rewarded ad
  const checkEligibility = useCallback(async (
    action: string,
    requiredUC: number
  ): Promise<AdEligibility | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('check_rewarded_ad_eligibility', {
        p_user_id: user.id,
        p_action: action,
        p_required_uc: requiredUC
      });

      if (error) {
        console.error('Error checking ad eligibility:', error);
        return null;
      }

      const response = data as unknown as EligibilityResponse;

      const result: AdEligibility = {
        canWatch: response?.can_watch ?? false,
        adsEnabled: response?.ads_enabled ?? false,
        dailyCap: response?.daily_cap ?? 2,
        currentCount: response?.current_count ?? 0,
        remainingToday: response?.remaining_today ?? 2,
        cooldownRemaining: response?.cooldown_remaining ?? 0,
        availableCredits: response?.available_credits ?? 0,
        requiredUC: response?.required_uc ?? requiredUC,
        neededUC: response?.needed_uc ?? 0,
        adsNeeded: response?.ads_needed ?? 0
      };

      setEligibility(result);
      return result;
    } catch (error) {
      console.error('Error in checkEligibility:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new ad session
  const createSession = useCallback(async (
    action: string,
    requiredUC: number,
    groupId?: string
  ): Promise<AdSession | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('create_rewarded_ad_session', {
        p_user_id: user.id,
        p_action: action,
        p_required_uc: requiredUC,
        p_group_id: groupId || null
      });

      if (error) {
        console.error('Error creating ad session:', error);
        return null;
      }

      const response = data as unknown as SessionResponse;

      if (!response?.success) {
        console.error('Failed to create session:', response?.error);
        return null;
      }

      const session: AdSession = {
        sessionId: response.session_id || '',
        neededUC: response.needed_uc || 0,
        rewardUC: response.reward_uc || 1
      };

      setCurrentSession(session);
      return session;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Claim reward after watching ad - Original method (grants credits)
  const claimReward = useCallback(async (sessionId: string): Promise<ClaimResult> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'not_authenticated' };
      }

      const { data, error } = await supabase.rpc('claim_rewarded_ad', {
        p_session_id: sessionId,
        p_user_id: user.id
      });

      if (error) {
        console.error('Error claiming reward:', error);
        return { success: false, error: error.message };
      }

      const response = data as unknown as ClaimResponse;

      if (!response?.success) {
        return { 
          success: false, 
          error: response?.error || 'unknown_error' 
        };
      }

      // Refresh eligibility after claiming
      if (eligibility) {
        await checkEligibility(eligibility.requiredUC.toString(), eligibility.requiredUC);
      }

      setCurrentSession(null);

      return {
        success: true,
        rewardUC: response.reward_uc,
        alreadyClaimed: response.already_claimed
      };
    } catch (error) {
      console.error('Error in claimReward:', error);
      return { success: false, error: 'exception' };
    } finally {
      setLoading(false);
    }
  }, [eligibility, checkEligibility]);

  // NEW: Claim reward as one-time action token (30 minutes validity)
  const claimRewardAsToken = useCallback(async (
    sessionId: string,
    actionType: string
  ): Promise<TokenClaimResult> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'not_authenticated' };
      }

      // First mark the ad session as claimed
      const { error: updateError } = await supabase
        .from('rewarded_ad_sessions')
        .update({ status: 'claimed', claimed_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating session:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create one-time action token
      const { data, error } = await supabase.rpc('create_ad_action_token', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_session_id: sessionId
      });

      if (error) {
        console.error('Error creating action token:', error);
        return { success: false, error: error.message };
      }

      const response = data as unknown as TokenResponse;

      if (!response?.success) {
        return { 
          success: false, 
          error: response?.error || 'unknown_error' 
        };
      }

      // Refresh eligibility
      if (eligibility) {
        await checkEligibility(eligibility.requiredUC.toString(), eligibility.requiredUC);
      }

      setCurrentSession(null);

      return {
        success: true,
        tokenId: response.token_id,
        expiresInMinutes: response.expires_in_minutes || 30
      };
    } catch (error) {
      console.error('Error in claimRewardAsToken:', error);
      return { success: false, error: 'exception' };
    } finally {
      setLoading(false);
    }
  }, [eligibility, checkEligibility]);

  // Check if user has a valid action token
  const checkValidToken = useCallback(async (actionType: string): Promise<{
    hasToken: boolean;
    tokenId?: string;
    minutesRemaining?: number;
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { hasToken: false };

      const { data, error } = await supabase.rpc('check_valid_ad_token', {
        p_user_id: user.id,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error checking token:', error);
        return { hasToken: false };
      }

      const response = data as { has_token?: boolean; token_id?: string; minutes_remaining?: number };
      
      return {
        hasToken: response?.has_token ?? false,
        tokenId: response?.token_id,
        minutesRemaining: response?.minutes_remaining
      };
    } catch (error) {
      console.error('Error in checkValidToken:', error);
      return { hasToken: false };
    }
  }, []);

  // Update session status (e.g., when ad is shown)
  const updateSessionStatus = useCallback(async (
    sessionId: string, 
    status: 'shown' | 'failed'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('rewarded_ad_sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSessionStatus:', error);
      return false;
    }
  }, []);

  // Format cooldown for display
  const formatCooldown = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  }, []);

  return {
    loading,
    eligibility,
    currentSession,
    checkEligibility,
    createSession,
    claimReward,
    claimRewardAsToken,
    checkValidToken,
    updateSessionStatus,
    formatCooldown
  };
}
