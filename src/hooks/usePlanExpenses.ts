import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface PlanExpense {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  spent_at: string;
  status: string;
  created_by: string;
  payer_id: string | null;
  group_id: string;
  category_id: string | null;
  plan_id: string | null;
  created_at: string | null;
  payer_profile?: {
    display_name: string | null;
    name: string | null;
    avatar_url: string | null;
  } | null;
  category?: {
    name_ar: string;
    icon: string | null;
  } | null;
}

export interface PlanExpenseStats {
  totalSpent: number;
  count: number;
  approvedTotal: number;
  pendingTotal: number;
}

export const usePlanExpenses = (planId: string | undefined) => {
  const { toast } = useToast();
  const { t } = useTranslation('plans');
  const queryClient = useQueryClient();

  const queryKey = ['plan-expenses', planId];

  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id, amount, currency, description, spent_at, status,
          created_by, payer_id, group_id, category_id, plan_id, created_at,
          profiles!expenses_payer_id_fkey(display_name, name, avatar_url),
          categories(name_ar, icon)
        `)
        .eq('plan_id', planId)
        .order('spent_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((exp: any) => ({
        ...exp,
        payer_profile: exp.profiles || null,
        category: exp.categories || null,
      })) as PlanExpense[];
    },
    enabled: !!planId,
  });

  const stats: PlanExpenseStats = {
    totalSpent: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    count: expenses.length,
    approvedTotal: expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + Number(e.amount), 0),
    pendingTotal: expenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + Number(e.amount), 0),
  };

  const linkExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, planId }: { expenseId: string; planId: string }) => {
      const { data, error } = await supabase.rpc('link_expense_to_plan', {
        p_expense_id: expenseId,
        p_plan_id: planId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t('expenses_tab.link_success') });
    },
    onError: () => {
      toast({ title: t('expenses_tab.link_error'), variant: 'destructive' });
    },
  });

  const unlinkExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { data, error } = await supabase.rpc('unlink_expense_from_plan', {
        p_expense_id: expenseId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t('expenses_tab.unlink_success') });
    },
    onError: () => {
      toast({ title: t('expenses_tab.unlink_error'), variant: 'destructive' });
    },
  });

  return {
    expenses,
    stats,
    isLoading,
    refetch,
    linkExpense: linkExpenseMutation.mutateAsync,
    unlinkExpense: unlinkExpenseMutation.mutateAsync,
    isLinking: linkExpenseMutation.isPending,
    isUnlinking: unlinkExpenseMutation.isPending,
  };
};
