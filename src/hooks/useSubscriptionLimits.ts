import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';

export interface SubscriptionLimits {
  members: number;
  groups: number;
  expenses: number;
  invites: number;
  ocr: number;
}

export interface SubscriptionLimitData {
  plan: string;
  action: string;
  limit_value: number;
}

export function useSubscriptionLimits() {
  const { subscription } = useSubscription();
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPlan = useCallback(() => {
    if (!subscription) return 'free';
    
    if (subscription.status === 'active' || 
        (subscription.status === 'trialing' && new Date(subscription.expires_at) > new Date())) {
      return subscription.plan;
    }
    
    return 'free';
  }, [subscription]);

  const fetchLimits = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentPlan = getCurrentPlan();
      
      const { data, error } = await supabase
        .from('subscription_limits')
        .select('action, limit_value')
        .eq('plan', currentPlan);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(`No limits found for plan: ${currentPlan}`);
      }

      const limitsMap: SubscriptionLimits = {
        members: 0,
        groups: 0,
        expenses: 0,
        invites: 0,
        ocr: 0
      };

      data.forEach((item) => {
        switch (item.action) {
          case 'add_member':
            limitsMap.members = item.limit_value;
            break;
          case 'group_created':
            limitsMap.groups = item.limit_value;
            break;
          case 'expense_created':
            limitsMap.expenses = item.limit_value;
            break;
          case 'invite_sent':
            limitsMap.invites = item.limit_value;
            break;
          case 'ocr_used':
            limitsMap.ocr = item.limit_value;
            break;
        }
      });

      setLimits(limitsMap);
    } catch (err) {
      console.error('Error fetching subscription limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch limits');
      
      // Fallback to default limits
      const defaultLimits: SubscriptionLimits = {
        members: 5,
        groups: 3,
        expenses: 100,
        invites: 10,
        ocr: 5
      };
      setLimits(defaultLimits);
    } finally {
      setLoading(false);
    }
  }, [getCurrentPlan]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const isUnlimited = useCallback((value: number) => {
    return value === -1;
  }, []);

  const formatLimit = useCallback((value: number) => {
    return isUnlimited(value) ? 'غير محدود' : value.toString();
  }, [isUnlimited]);

  const getUsagePercentage = useCallback((current: number, limit: number) => {
    if (isUnlimited(limit)) return 0;
    return Math.min((current / limit) * 100, 100);
  }, [isUnlimited]);

  const isNearLimit = useCallback((current: number, limit: number, threshold = 75) => {
    if (isUnlimited(limit)) return false;
    return (current / limit) * 100 >= threshold;
  }, [isUnlimited]);

  const isAtLimit = useCallback((current: number, limit: number) => {
    if (isUnlimited(limit)) return false;
    return current >= limit;
  }, [isUnlimited]);

  return {
    limits,
    loading,
    error,
    currentPlan: getCurrentPlan(),
    isFreePlan: getCurrentPlan() === 'free',
    refresh: fetchLimits,
    // Utility functions
    isUnlimited,
    formatLimit,
    getUsagePercentage,
    isNearLimit,
    isAtLimit
  };
}