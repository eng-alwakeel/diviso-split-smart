import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type TableName = 'expenses' | 'settlements' | 'groups' | 'onboarding_tasks' | 'expense_approvals' | 'group_members';

interface UnifiedListenerConfig {
  userId?: string | null;
  groupId?: string | null;
  tables: TableName[];
  onUpdate?: (table: TableName, payload: any) => void;
}

// Singleton channel manager to prevent duplicate subscriptions
const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export const useUnifiedRealtimeListener = ({
  userId,
  groupId,
  tables,
  onUpdate
}: UnifiedListenerConfig) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const invalidateQueries = useCallback((table: TableName) => {
    // Batch invalidations based on table
    switch (table) {
      case 'expenses':
      case 'expense_approvals':
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['group-data'] });
        queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
        break;
      case 'settlements':
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['group-balance'] });
        break;
      case 'groups':
      case 'group_members':
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        break;
      case 'onboarding_tasks':
        queryClient.invalidateQueries({ queryKey: ['onboarding'] });
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!userId && !groupId) return;
    if (tables.length === 0) return;

    // Create unique channel key
    const channelKey = `unified-${userId || 'no-user'}-${groupId || 'no-group'}-${tables.sort().join('-')}`;
    
    // Reuse existing channel if available
    if (activeChannels.has(channelKey)) {
      channelRef.current = activeChannels.get(channelKey)!;
      return;
    }

    const channel = supabase.channel(channelKey);

    // Add listeners for each table
    tables.forEach(table => {
      const filter = table === 'onboarding_tasks' && userId
        ? `user_id=eq.${userId}`
        : groupId && ['expenses', 'settlements', 'expense_approvals'].includes(table)
          ? `group_id=eq.${groupId}`
          : undefined;

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {})
        },
        (payload) => {
          invalidateQueries(table);
          onUpdate?.(table, payload);
        }
      );
    });

    channel.subscribe();
    channelRef.current = channel;
    activeChannels.set(channelKey, channel);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        activeChannels.delete(channelKey);
        channelRef.current = null;
      }
    };
  }, [userId, groupId, tables.join(','), invalidateQueries, onUpdate]);

  return {
    channel: channelRef.current
  };
};

// Helper hook for dashboard-specific updates
export const useDashboardRealtimeListener = (userId: string | null) => {
  return useUnifiedRealtimeListener({
    userId,
    tables: ['expenses', 'settlements', 'groups', 'onboarding_tasks']
  });
};

// Helper hook for group-specific updates
export const useGroupRealtimeListener = (groupId: string | null, userId?: string | null) => {
  return useUnifiedRealtimeListener({
    userId,
    groupId,
    tables: ['expenses', 'settlements', 'expense_approvals', 'group_members']
  });
};
