import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';

export interface SubscriptionLimits {
  members: number;
  groups: number;
  expenses: number;
  invites: number;
  ocr: number;
  reportExport: number;
  dataRetentionMonths: number;
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
      console.log('useSubscriptionLimits: Current plan:', currentPlan);
      
      const { data, error } = await supabase
        .from('subscription_limits')
        .select('action, limit_value')
        .eq('plan', currentPlan);

      if (error) {
        console.error('useSubscriptionLimits: Database error:', error);
        throw error;
      }

      console.log('useSubscriptionLimits: Retrieved limits data:', data);

      if (!data || data.length === 0) {
        console.warn('useSubscriptionLimits: No limits found for plan:', currentPlan);
        throw new Error(`No limits found for plan: ${currentPlan}`);
      }

      const limitsMap: SubscriptionLimits = {
        members: 0,
        groups: 0,
        expenses: 0,
        invites: 0,
        ocr: 0,
        reportExport: 0,
        dataRetentionMonths: 0
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
          case 'report_export':
            limitsMap.reportExport = item.limit_value;
            break;
          case 'data_retention_months':
            limitsMap.dataRetentionMonths = item.limit_value;
            break;
        }
      });

      console.log('useSubscriptionLimits: Final limits map:', limitsMap);
      setLimits(limitsMap);
    } catch (err) {
      console.error('useSubscriptionLimits: Error fetching limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch limits');
      
      // Fallback to default limits for free plan
      const defaultLimits: SubscriptionLimits = {
        members: 5,
        groups: 3,
        expenses: 50,
        invites: 10,
        ocr: 10,
        reportExport: 5,
        dataRetentionMonths: 6
      };
      console.log('useSubscriptionLimits: Using fallback limits:', defaultLimits);
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