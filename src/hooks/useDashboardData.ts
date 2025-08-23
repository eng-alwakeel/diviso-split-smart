import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceOptimization } from "./usePerformanceOptimization";

interface GroupData {
  id: string;
  name: string;
  members: number;
  expenses: number;
  totalExpenses: number;
  category?: string;
}

interface ExpenseData {
  id: string;
  description: string | null;
  amount: number;
  group_id: string;
  spent_at: string | null;
  created_at: string | null;
  payer_id: string | null;
}

interface DashboardData {
  myPaid: number;
  myOwed: number;
  monthlyTotalExpenses: number;
  weeklyExpensesCount: number;
  groupsCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardData = (): DashboardData => {
  const { toast } = useToast();
  const { createCache, measurePerformance } = usePerformanceOptimization();
  const cache = useMemo(() => createCache(50), [createCache]);
  
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'error' | 'refetch'>>({
    myPaid: 0,
    myOwed: 0,
    monthlyTotalExpenses: 0,
    weeklyExpensesCount: 0,
    groupsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = `dashboard-data-${Date.now() - (Date.now() % (5 * 60 * 1000))}`; // 5-minute cache windows
    
    // Check cache first with timestamp validation
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < 5 * 60 * 1000)) {
      setData(cachedData.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      
      if (!uid) {
        setLoading(false);
        return;
      }

      // Optimized parallel queries with minimal data selection
      const [membershipResult] = await Promise.all([
        supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', uid)
          .limit(100) // Reasonable limit for groups
      ]);

      const groupIds = (membershipResult.data ?? []).map((m: any) => m.group_id);
      
      if (!groupIds.length) {
        const emptyData = {
          myPaid: 0,
          myOwed: 0,
          monthlyTotalExpenses: 0,
          weeklyExpensesCount: 0,
          groupsCount: 0,
        };
        setData(emptyData);
        cache.set(cacheKey, { data: emptyData, timestamp: Date.now() });
        setLoading(false);
        return;
      }

      // Optimized queries with specific date ranges and limits
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [paidResult, owedResult, monthlyResult, weeklyResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('amount')
          .eq('payer_id', uid)
          .eq('status', 'approved')
          .limit(1000),
        
        supabase
          .from('expense_splits')
          .select('share_amount')
          .eq('member_id', uid)
          .limit(1000),
          
        supabase
          .from('expenses')
          .select('amount')
          .eq('payer_id', uid)
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

      const totalPaid = (paidResult.data ?? []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const totalOwed = (owedResult.data ?? []).reduce((sum, s) => sum + Number(s.share_amount || 0), 0);
      const monthlyTotal = (monthlyResult.data ?? []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const dashboardResult = {
        myPaid: totalPaid,
        myOwed: totalOwed,
        monthlyTotalExpenses: monthlyTotal,
        weeklyExpensesCount: weeklyResult.data?.length || 0,
        groupsCount: groupIds.length,
      };

      setData(dashboardResult);
      cache.set(cacheKey, { data: dashboardResult, timestamp: Date.now() });

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('فشل في تحميل بيانات الداشبورد');
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل بيانات الداشبورد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [cache, toast]);

  const measuredFetchData = useMemo(
    () => measurePerformance('dashboard-fetch', fetchData),
    [measurePerformance, fetchData]
  );

  useEffect(() => {
    measuredFetchData();
  }, [measuredFetchData]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  };
};