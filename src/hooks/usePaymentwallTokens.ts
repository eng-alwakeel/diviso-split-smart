import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentwallToken {
  id: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
}

interface PaymentwallStatus {
  available: number;        // Available tokens now
  usedToday: number;        // Used today
  dailyLimit: number;       // Daily limit (5)
  cooldownEndsAt: Date | null;  // Cooldown end time
  cooldownSeconds: number;  // Remaining cooldown seconds
  canUse: boolean;          // Can use now
}

export function usePaymentwallTokens() {
  const [status, setStatus] = useState<PaymentwallStatus>({
    available: 0,
    usedToday: 0,
    dailyLimit: 5,
    cooldownEndsAt: null,
    cooldownSeconds: 0,
    canUse: false
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const now = new Date();

      // Fetch today's tokens
      const { data: tokens, error } = await supabase
        .from('one_time_action_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('source', 'paymentwall')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Paymentwall tokens:', error);
        setLoading(false);
        return;
      }

      // Cast tokens to the correct type
      const typedTokens = (tokens || []) as unknown as PaymentwallToken[];

      const available = typedTokens.filter(t => 
        !t.is_used && new Date(t.expires_at) > now
      ).length;

      const usedToday = typedTokens.filter(t => t.is_used).length;

      // Check cooldown (last used token + 30 seconds)
      const lastUsedToken = typedTokens.find(t => t.is_used && t.used_at);
      let cooldownEndsAt: Date | null = null;
      let cooldownSeconds = 0;

      if (lastUsedToken?.used_at) {
        const usedAt = new Date(lastUsedToken.used_at);
        cooldownEndsAt = new Date(usedAt.getTime() + 30 * 1000);
        
        if (cooldownEndsAt > now) {
          cooldownSeconds = Math.ceil((cooldownEndsAt.getTime() - now.getTime()) / 1000);
        } else {
          cooldownEndsAt = null;
        }
      }

      setStatus({
        available,
        usedToday,
        dailyLimit: 5,
        cooldownEndsAt,
        cooldownSeconds,
        canUse: available > 0 && cooldownSeconds === 0
      });
    } catch (error) {
      console.error('Error in fetchStatus:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use a token (starts 30-second activation)
  const useToken = useCallback(async (): Promise<{ success: boolean; tokenId?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const now = new Date();

      // Get oldest valid unused token
      const { data: token, error } = await supabase
        .from('one_time_action_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('source', 'paymentwall')
        .eq('is_used', false)
        .gt('expires_at', now.toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !token) {
        console.log('No available Paymentwall token');
        return { success: false };
      }

      // Update token: mark as used with 30-second window
      const { error: updateError } = await supabase
        .from('one_time_action_tokens')
        .update({
          is_used: true,
          used_at: now.toISOString()
        })
        .eq('id', token.id);

      if (updateError) {
        console.error('Error using token:', updateError);
        return { success: false };
      }

      console.log('Paymentwall token consumed:', token.id);
      await fetchStatus();
      return { success: true, tokenId: token.id };
    } catch (error) {
      console.error('Error in useToken:', error);
      return { success: false };
    }
  }, [fetchStatus]);

  // Check if there's an available token without cooldown
  const hasAvailableToken = useCallback(async (): Promise<boolean> => {
    await fetchStatus();
    return status.canUse;
  }, [fetchStatus, status.canUse]);

  // Check for cooldown only
  const checkCooldown = useCallback(async (): Promise<{ active: boolean; remainingSeconds: number }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { active: false, remainingSeconds: 0 };

      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

      // Check if any token was used in the last 30 seconds
      const { data: recentUsed } = await supabase
        .from('one_time_action_tokens')
        .select('used_at')
        .eq('user_id', user.id)
        .eq('source', 'paymentwall')
        .eq('is_used', true)
        .gte('used_at', thirtySecondsAgo.toISOString())
        .order('used_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentUsed?.used_at) {
        const usedAt = new Date(recentUsed.used_at);
        const cooldownEnds = new Date(usedAt.getTime() + 30 * 1000);
        const remainingSeconds = Math.ceil((cooldownEnds.getTime() - now.getTime()) / 1000);
        
        if (remainingSeconds > 0) {
          return { active: true, remainingSeconds };
        }
      }

      return { active: false, remainingSeconds: 0 };
    } catch (error) {
      console.error('Error checking cooldown:', error);
      return { active: false, remainingSeconds: 0 };
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // Update every 5 seconds to track cooldown
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status,
    loading,
    useToken,
    hasAvailableToken,
    checkCooldown,
    refetch: fetchStatus
  };
}
