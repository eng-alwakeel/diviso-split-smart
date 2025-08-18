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
    const cacheKey = 'dashboard-data';
    
    // Check cache first
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey));
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

      // Use parallel queries for better performance
      // Get user's group memberships
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', uid);
          
        const groupIds = (memberships ?? []).map((m: any) => m.group_id);
        
        if (!groupIds.length) {
          const emptyData = {
            myPaid: 0,
            myOwed: 0,
            monthlyTotalExpenses: 0,
            weeklyExpensesCount: 0,
            groupsCount: 0,
          };
          setData(emptyData);
          cache.set(cacheKey, emptyData);
          setLoading(false);
          return;
        }

        // Parallel queries for better performance
        const [expenseResult, splitsResult, monthlyResult, weeklyResult] = await Promise.all([
          supabase
            .from('expenses')
            .select('id, group_id, amount, payer_id, status')
            .in('group_id', groupIds)
            .eq('status', 'approved'),
          
          supabase
            .from('expense_splits')
            .select('share_amount, expense_id')
            .eq('member_id', uid),
            
          supabase
            .from('expenses')
            .select('amount')
            .eq('payer_id', uid)
            .eq('status', 'approved')
            .gte('spent_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
            
          supabase
            .from('expenses')
            .select('id')
            .in('group_id', groupIds)
            .gte('spent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const expenses = expenseResult.data ?? [];
        const splits = splitsResult.data ?? [];
        const monthlyExpenses = monthlyResult.data ?? [];
        const weeklyExpenses = weeklyResult.data ?? [];

        // Calculate totals
        const totalPaid = expenses
          .filter(e => e.payer_id === uid)
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const expenseIds = expenses.map(e => e.id);
        const totalOwed = splits
          .filter(s => expenseIds.includes(s.expense_id))
          .reduce((sum, split) => sum + Number(split.share_amount || 0), 0);

        const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

        const dashboardResult = {
          myPaid: totalPaid,
          myOwed: totalOwed,
          monthlyTotalExpenses: monthlyTotal,
          weeklyExpensesCount: weeklyExpenses.length,
          groupsCount: groupIds.length,
        };

      setData(dashboardResult);
      cache.set(cacheKey, dashboardResult);

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
  }, [cache]);

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