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
  groups: GroupData[];
  recentExpenses: ExpenseData[];
  myPaid: number;
  myOwed: number;
  groupPaidMap: Record<string, number>;
  groupOwedMap: Record<string, number>;
  mySplitByExpense: Record<string, number>;
  monthlyTotalExpenses: number;
  weeklyExpensesCount: number;
  currentUserId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardData = (): DashboardData => {
  const { toast } = useToast();
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'error' | 'refetch'>>({
    groups: [],
    recentExpenses: [],
    myPaid: 0,
    myOwed: 0,
    groupPaidMap: {},
    groupOwedMap: {},
    mySplitByExpense: {},
    monthlyTotalExpenses: 0,
    weeklyExpensesCount: 0,
    currentUserId: null,
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

      setData(prev => ({ ...prev, currentUserId: uid }));

      // Get user's group memberships
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', uid);
        
      const groupIds = (memberships ?? []).map((m: any) => m.group_id);
      
      if (!groupIds.length) {
        setData(prev => ({
          ...prev,
          groups: [],
          recentExpenses: [],
          myPaid: 0,
          myOwed: 0,
          groupPaidMap: {},
          groupOwedMap: {},
        }));
        setLoading(false);
        return;
      }

      // Fetch groups data
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds);

      // Count members per group
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);
        
      const memberCount: Record<string, number> = {};
      (memberRows ?? []).forEach((r: any) => {
        memberCount[r.group_id] = (memberCount[r.group_id] || 0) + 1;
      });

      // Fetch expenses
      const { data: expenseRows } = await supabase
        .from('expenses')
        .select('id, group_id, amount, payer_id')
        .in('group_id', groupIds);

      // Calculate group totals and track expense-group mapping
      const groupTotals: Record<string, number> = {};
      const groupCounts: Record<string, number> = {};
      const expenseToGroup: Record<string, string> = {};
      
      (expenseRows ?? []).forEach((e: any) => {
        groupTotals[e.group_id] = (groupTotals[e.group_id] || 0) + Number(e.amount || 0);
        groupCounts[e.group_id] = (groupCounts[e.group_id] || 0) + 1;
        expenseToGroup[e.id] = e.group_id;
      });

      // Calculate what user paid (per group and total)
      const paidByGroup: Record<string, number> = {};
      const totalPaid = (expenseRows ?? []).reduce((sum: number, e: any) => {
        if (e.payer_id === uid) {
          paidByGroup[e.group_id] = (paidByGroup[e.group_id] || 0) + Number(e.amount || 0);
          return sum + Number(e.amount || 0);
        }
        return sum;
      }, 0);

      // Calculate what user owes (per group and total)
      let totalOwed = 0;
      const owedByGroup: Record<string, number> = {};
      const splitMap: Record<string, number> = {};
      
      const expenseIds = (expenseRows ?? []).map((e: any) => e.id);
      if (expenseIds.length) {
        const { data: userSplits } = await supabase
          .from('expense_splits')
          .select('expense_id, share_amount')
          .eq('member_id', uid)
          .in('expense_id', expenseIds);
          
        (userSplits ?? []).forEach((split: any) => {
          const groupId = expenseToGroup[split.expense_id];
          const amount = Number(split.share_amount || 0);
          
          splitMap[split.expense_id] = amount;
          if (groupId) {
            owedByGroup[groupId] = (owedByGroup[groupId] || 0) + amount;
            totalOwed += amount;
          }
        });
      }

      // Map groups with calculated data
      const mappedGroups = (groupsData ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        members: memberCount[g.id] || 0,
        expenses: groupCounts[g.id] || 0,
        totalExpenses: groupTotals[g.id] || 0,
      }));

      // Fetch recent expenses
      const { data: recentExpensesData } = await supabase
        .from('expenses')
        .select('id, description, amount, group_id, spent_at, created_at, payer_id')
        .in('group_id', groupIds)
        .order('spent_at', { ascending: false })
        .limit(5);

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
        groups: mappedGroups,
        recentExpenses: recentExpensesData ?? [],
        myPaid: totalPaid,
        myOwed: totalOwed,
        groupPaidMap: paidByGroup,
        groupOwedMap: owedByGroup,
        mySplitByExpense: splitMap,
        monthlyTotalExpenses: monthlyTotal,
        weeklyExpensesCount: (weeklyExpenses ?? []).length,
        currentUserId: uid,
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