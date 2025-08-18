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
    console.log('Fetching budget tracking for group:', groupId);
    
    // محاولة استخدام الـ RPC function المحسنة أولاً
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_group_budget_tracking_v2', {
      p_group_id: groupId
    });
    
    if (!rpcError && rpcData && rpcData.length > 0) {
      console.log('RPC function succeeded, returning data:', rpcData.length, 'categories');
      return rpcData.map((item: any) => ({
        category_id: item.category_id,
        category_name: item.category_name || 'غير محدد',
        budgeted_amount: Number(item.budgeted_amount) || 0,
        spent_amount: Number(item.spent_amount) || 0,
        remaining_amount: Number(item.remaining_amount) || 0,
        spent_percentage: Number(item.spent_percentage) || 0,
        status: item.status as BudgetTrackingData['status'],
        expense_count: Number(item.expense_count) || 0,
      }));
    }
    
    // استخدام fallback query محسن يعرض جميع الفئات
    console.log('RPC failed or returned empty, using enhanced fallback query. Error:', rpcError?.message);
    
    const { data: budgetCategories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select(`
        id,
        category_id,
        allocated_amount,
        categories(id, name_ar),
        budgets(id, group_id, start_date, end_date, name)
      `)
      .eq('budgets.group_id', groupId)
      .lte('budgets.start_date', new Date().toISOString().split('T')[0])
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`, { foreignTable: 'budgets' });
      
    if (categoriesError) {
      console.error('Fallback query failed:', categoriesError);
      throw categoriesError;
    }
    
    console.log('Fallback query returned:', budgetCategories?.length || 0, 'budget categories');
    
    const result: BudgetTrackingData[] = [];
    
    for (const budgetCategory of budgetCategories || []) {
      // التأكد من وجود category_id
      if (!budgetCategory.category_id || !budgetCategory.categories) {
        console.warn('Skipping budget category without category_id or categories:', budgetCategory);
        continue;
      }

      console.log('Processing category:', budgetCategory.categories.name_ar, 'ID:', budgetCategory.category_id);

      // استخدام expense_budget_links للحصول على المصاريف المربوطة
      const { data: expenseLinks, error: expenseError } = await supabase
        .from('expense_budget_links')
        .select(`
          expenses(id, amount, status, group_id)
        `)
        .eq('budget_category_id', budgetCategory.id);

      if (expenseError) {
        console.error('Error fetching expense links for category:', budgetCategory.category_id, expenseError);
      }

      // حساب المصاريف المعتمدة فقط من نفس المجموعة
      const approvedExpenses = expenseLinks?.filter((link: any) => 
        link.expenses && 
        link.expenses.status === 'approved' && 
        link.expenses.group_id === groupId
      ) || [];

      const spent_amount = approvedExpenses.reduce((sum, link: any) => 
        sum + Number(link.expenses.amount), 0);
      
      const budgeted_amount = Number(budgetCategory.allocated_amount) || 0;
      const remaining_amount = budgeted_amount - spent_amount;
      const spent_percentage = budgeted_amount > 0 ? (spent_amount / budgeted_amount) * 100 : 0;

      let status: BudgetTrackingData['status'] = 'safe';
      if (budgeted_amount === 0) status = 'no_budget';
      else if (spent_amount > budgeted_amount) status = 'exceeded';
      else if (spent_percentage >= 90) status = 'critical';
      else if (spent_percentage >= 80) status = 'warning';

      console.log(`Category ${budgetCategory.categories.name_ar}: Budget=${budgeted_amount}, Spent=${spent_amount}, Status=${status}`);

      result.push({
        category_id: budgetCategory.category_id,
        category_name: budgetCategory.categories.name_ar || 'غير محدد',
        budgeted_amount,
        spent_amount,
        remaining_amount,
        spent_percentage,
        status,
        expense_count: approvedExpenses.length,
      });
    }

    console.log('Final result:', result.length, 'categories processed');
    result.forEach(r => console.log(`- ${r.category_name}: ${r.budgeted_amount} (${r.status})`));

    return result.sort((a, b) => {
      // ترتيب حسب النسبة المنفقة ثم الميزانية
      if (a.spent_percentage !== b.spent_percentage) {
        return b.spent_percentage - a.spent_percentage;
      }
      return b.budgeted_amount - a.budgeted_amount;
    });
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