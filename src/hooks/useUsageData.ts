import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UsageData {
  groups: number;
  members: number;
  expenses: number;
  invites: number;
  ocr: number;
  reportExport: number;
  dataRetention: number;
}

export const useUsageData = () => {
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<UsageData>({
    groups: 0,
    members: 0,
    expenses: 0,
    invites: 0,
    ocr: 0,
    reportExport: 0,
    dataRetention: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsageData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get start of current month for monthly limits
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Fetch groups count (where user is a member)
        const { data: groupsData, error: groupsError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (groupsError) throw groupsError;

        // Get total members count across all user's groups
        let totalMembers = 0;
        if (groupsData && groupsData.length > 0) {
          const groupIds = groupsData.map(gm => gm.group_id);
          const { data: membersData, error: membersError } = await supabase
            .from('group_members')
            .select('id')
            .in('group_id', groupIds);

          if (membersError) throw membersError;
          totalMembers = membersData?.length || 0;
        }

        // Fetch monthly expenses count (created by user)
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('id')
          .eq('created_by', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (expensesError) throw expensesError;

        // Fetch monthly invites count (created by user)
        const { data: invitesData, error: invitesError } = await supabase
          .from('invites')
          .select('id')
          .eq('created_by', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (invitesError) throw invitesError;

        // Fetch monthly OCR usage (created by user)
        const { data: ocrData, error: ocrError } = await supabase
          .from('receipt_ocr')
          .select('id')
          .eq('created_by', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (ocrError) throw ocrError;

        // Calculate actual data retention (age of oldest data in months)
        let dataRetentionMonths = 0;
        
        // Get oldest expense
        const { data: oldestExpense } = await supabase
          .from('expenses')
          .select('created_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        // Get oldest group
        const { data: oldestGroup } = await supabase
          .from('groups')
          .select('created_at')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        // Find the oldest date between expenses and groups
        let oldestDate = null;
        if (oldestExpense && oldestExpense.length > 0) {
          oldestDate = new Date(oldestExpense[0].created_at);
        }
        if (oldestGroup && oldestGroup.length > 0) {
          const groupDate = new Date(oldestGroup[0].created_at);
          if (!oldestDate || groupDate < oldestDate) {
            oldestDate = groupDate;
          }
        }

        // Calculate months difference
        if (oldestDate) {
          const now = new Date();
          const yearsDiff = now.getFullYear() - oldestDate.getFullYear();
          const monthsDiff = now.getMonth() - oldestDate.getMonth();
          dataRetentionMonths = Math.max(1, yearsDiff * 12 + monthsDiff);
        }

        const usageData: UsageData = {
          groups: groupsData?.length || 0,
          members: totalMembers,
          expenses: expensesData?.length || 0,
          invites: invitesData?.length || 0,
          ocr: ocrData?.length || 0,
          reportExport: 0, // Placeholder - needs specific tracking
          dataRetention: dataRetentionMonths
        };

        console.log('Usage data fetched:', {
          userId: user.id,
          usage: usageData,
          startOfMonth: startOfMonth.toISOString()
        });

        setUsage(usageData);
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [user]);

  return {
    usage,
    loading,
    error,
    refetch: () => {
      if (user) {
        // Re-run the effect by updating a dependency
        setLoading(true);
      }
    }
  };
};