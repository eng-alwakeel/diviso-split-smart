import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BudgetTrackingData = {
  category_id: string | null;
  category_name: string | null;
  budgeted_amount: number;
  spent_amount: number;
  remaining_amount: number;
  spent_percentage: number;
  status: 'safe' | 'warning' | 'critical' | 'exceeded' | 'no_budget';
  expense_count: number;
};

export type BudgetAlert = {
  category_id: string | null;
  category_name: string | null;
  alert_type: 'warning' | 'critical' | 'exceeded';
  budgeted_amount: number;
  spent_amount: number;
  spent_percentage: number;
};

async function fetchGroupBudgetTracking(groupId: string): Promise<BudgetTrackingData[]> {
  try {
    const { data, error } = await supabase.rpc('get_group_budget_tracking', {
      p_group_id: groupId
    });
    
    if (error) {
      // Fallback to direct query if RPC fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('budget_categories')
        .select(`
          category_id,
          allocated_amount,
          categories!inner(name_ar),
          budgets!inner(group_id, start_date, end_date)
        `)
        .eq('budgets.group_id', groupId)
        .lte('budgets.start_date', new Date().toISOString().split('T')[0])
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`, { foreignTable: 'budgets' });
        
      if (fallbackError) throw fallbackError;
      
      return (fallbackData || []).map(item => ({
        category_id: item.category_id,
        category_name: item.categories?.name_ar || 'Unknown',
        budgeted_amount: item.allocated_amount,
        spent_amount: 0, // Will be calculated later
        remaining_amount: item.allocated_amount,
        spent_percentage: 0,
        status: 'safe' as const,
        expense_count: 0
      }));
    }
    
    return (data || []) as BudgetTrackingData[];
  } catch (error) {
    console.error('Error fetching group budget tracking:', error);
    throw error;
  }
}

async function fetchBudgetAlerts(groupId: string): Promise<BudgetAlert[]> {
  const { data, error } = await supabase.rpc('check_budget_alerts', {
    p_group_id: groupId
  });
  
  if (error) throw error;
  return (data || []) as BudgetAlert[];
}

export function useGroupBudgetTracking(groupId?: string) {
  const budgetTrackingQuery = useQuery({
    queryKey: ["group-budget-tracking", groupId],
    queryFn: () => fetchGroupBudgetTracking(groupId!),
    enabled: !!groupId,
  });

  const budgetAlertsQuery = useQuery({
    queryKey: ["group-budget-alerts", groupId],
    queryFn: () => fetchBudgetAlerts(groupId!),
    enabled: !!groupId,
  });

  const getStatusColor = (status: BudgetTrackingData['status']) => {
    switch (status) {
      case 'safe': return 'text-emerald-600';
      case 'warning': return 'text-amber-600';
      case 'critical': return 'text-orange-600';
      case 'exceeded': return 'text-destructive';
      case 'no_budget': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (status: BudgetTrackingData['status']) => {
    switch (status) {
      case 'safe': return 'آمن';
      case 'warning': return 'تحذير';
      case 'critical': return 'حرج';
      case 'exceeded': return 'تجاوز';
      case 'no_budget': return 'بدون ميزانية';
      default: return 'غير محدد';
    }
  };

  const getAlertMessage = (alert: BudgetAlert) => {
    const percentage = Math.round(alert.spent_percentage);
    switch (alert.alert_type) {
      case 'warning':
        return `تم إنفاق ${percentage}% من ميزانية ${alert.category_name}`;
      case 'critical':
        return `تحذير: تم إنفاق ${percentage}% من ميزانية ${alert.category_name}`;
      case 'exceeded':
        return `تم تجاوز ميزانية ${alert.category_name} بمقدار ${alert.spent_amount - alert.budgeted_amount} ر.س`;
      default:
        return `تنبيه لميزانية ${alert.category_name}`;
    }
  };

  return {
    budgetTracking: budgetTrackingQuery.data || [],
    budgetAlerts: budgetAlertsQuery.data || [],
    isLoading: budgetTrackingQuery.isLoading || budgetAlertsQuery.isLoading,
    error: budgetTrackingQuery.error || budgetAlertsQuery.error,
    refetch: () => {
      budgetTrackingQuery.refetch();
      budgetAlertsQuery.refetch();
    },
    getStatusColor,
    getStatusLabel,
    getAlertMessage,
  };
}