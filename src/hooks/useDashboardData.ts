import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'error' | 'refetch'>>({
    myPaid: 0,
    myOwed: 0,
    monthlyTotalExpenses: 0,
    weeklyExpensesCount: 0,
    groupsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      
      if (!uid) {
        setLoading(false);
        return;
      }

      // Get user's group memberships
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', uid);
        
      const groupIds = (memberships ?? []).map((m: any) => m.group_id);
      
      if (!groupIds.length) {
        setData({
          myPaid: 0,
          myOwed: 0,
          monthlyTotalExpenses: 0,
          weeklyExpensesCount: 0,
          groupsCount: 0,
        });
        setLoading(false);
        return;
      }

      // Fetch expenses for calculations
      const { data: expenseRows } = await supabase
        .from('expenses')
        .select('id, group_id, amount, payer_id')
        .in('group_id', groupIds);

      // Calculate what user paid
      const totalPaid = (expenseRows ?? []).reduce((sum: number, e: any) => {
        if (e.payer_id === uid) {
          return sum + Number(e.amount || 0);
        }
        return sum;
      }, 0);

      // Calculate what user owes
      let totalOwed = 0;
      const expenseIds = (expenseRows ?? []).map((e: any) => e.id);
      if (expenseIds.length) {
        const { data: userSplits } = await supabase
          .from('expense_splits')
          .select('share_amount')
          .eq('member_id', uid)
          .in('expense_id', expenseIds);
          
        totalOwed = (userSplits ?? []).reduce((sum, split) => {
          return sum + Number(split.share_amount || 0);
        }, 0);
      }

      // Calculate monthly total expenses for current user
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('payer_id', uid)
        .gte('spent_at', startOfMonth.toISOString());
        
      const monthlyTotal = (monthlyExpenses ?? []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

      // Calculate weekly expenses count
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyExpenses } = await supabase
        .from('expenses')
        .select('id')
        .in('group_id', groupIds)
        .gte('spent_at', weekAgo.toISOString());

      setData({
        myPaid: totalPaid,
        myOwed: totalOwed,
        monthlyTotalExpenses: monthlyTotal,
        weeklyExpensesCount: (weeklyExpenses ?? []).length,
        groupsCount: groupIds.length,
      });

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
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  };
};