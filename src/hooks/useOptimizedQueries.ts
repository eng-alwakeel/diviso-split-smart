import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';

interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
}

// Optimized query keys with proper invalidation
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  dashboardData: (userId?: string) => ['dashboard', 'data', userId] as const,
  groups: ['groups'] as const,
  userGroups: (userId?: string) => ['groups', 'user', userId] as const,
  expenses: ['expenses'] as const,
  userExpenses: (userId?: string, groupId?: string) => ['expenses', 'user', userId, groupId] as const,
  subscription: ['subscription'] as const,
  userSubscription: (userId?: string) => ['subscription', 'user', userId] as const,
} as const;

// Default options for different types of queries
const defaultOptions = {
  dashboard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
} as const;

export const useOptimizedDashboardData = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.dashboardData(userId),
    queryFn: async () => {
      if (!userId) return null;

      // Optimized queries with limits and proper date handling
      const [membershipResult] = await Promise.all([
        supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId)
          .limit(100)
      ]);

      const groupIds = (membershipResult.data ?? []).map(m => m.group_id);
      
      if (!groupIds.length) {
        return {
          myPaid: 0,
          myOwed: 0,
          monthlyTotalExpenses: 0,
          weeklyExpensesCount: 0,
          groupsCount: 0,
        };
      }

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [paidResult, owedResult, monthlyResult, weeklyResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('amount')
          .eq('payer_id', userId)
          .eq('status', 'approved')
          .limit(1000),
        
        supabase
          .from('expense_splits')
          .select('share_amount')
          .eq('member_id', userId)
          .limit(1000),
          
        supabase
          .from('expenses')
          .select('amount')
          .eq('payer_id', userId)
          .eq('status', 'approved')
          .gte('spent_at', monthStart)
          .limit(1000),
          
        supabase
          .from('expenses')
          .select('id')
          .in('group_id', groupIds)
          .gte('spent_at', weekStart)
          .limit(1000)
      ]);

      return {
        myPaid: (paidResult.data ?? []).reduce((sum, e) => sum + Number(e.amount || 0), 0),
        myOwed: (owedResult.data ?? []).reduce((sum, s) => sum + Number(s.share_amount || 0), 0),
        monthlyTotalExpenses: (monthlyResult.data ?? []).reduce((sum, e) => sum + Number(e.amount || 0), 0),
        weeklyExpensesCount: weeklyResult.data?.length || 0,
        groupsCount: groupIds.length,
      };
    },
    enabled: !!userId,
    ...defaultOptions.dashboard,
  });
};

export const useOptimizedSubscriptionData = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.userSubscription(userId),
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    ...defaultOptions.static,
  });
};

export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateDashboard = useCallback(
    (userId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardData(userId) });
      }
    },
    [queryClient]
  );

  const invalidateGroups = useCallback(
    (userId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userGroups(userId) });
      }
    },
    [queryClient]
  );

  const invalidateExpenses = useCallback(
    (userId?: string, groupId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userExpenses(userId, groupId) });
      }
    },
    [queryClient]
  );

  const prefetchDashboard = useCallback(
    async (userId: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardData(userId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
            .limit(100);
          if (error) throw error;
          return data || [];
        },
        staleTime: defaultOptions.dashboard.staleTime,
      });
    },
    [queryClient]
  );

  return {
    invalidateDashboard,
    invalidateGroups,
    invalidateExpenses,
    prefetchDashboard,
  };
};

export const useBackgroundSync = (userId?: string) => {
  const { prefetchDashboard, invalidateDashboard } = useQueryInvalidation();

  // Background sync for dashboard data
  const syncDashboard = useCallback(async () => {
    if (!userId) return;
    
    try {
      await prefetchDashboard(userId);
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }, [userId, prefetchDashboard]);

  // Setup periodic background sync
  const setupBackgroundSync = useCallback(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      // Only sync when page is visible
      if (document.visibilityState === 'visible') {
        syncDashboard();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [userId, syncDashboard]);

  return {
    syncDashboard,
    setupBackgroundSync,
  };
};