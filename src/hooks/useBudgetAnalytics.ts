import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Budget } from "./useBudgets";

export type BudgetAnalytics = {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  spendingPercentage: number;
  categoryBreakdown: {
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
  }[];
  monthlySpending: {
    month: string;
    amount: number;
  }[];
};

async function fetchBudgetAnalytics(): Promise<BudgetAnalytics> {
  // Get all budgets
  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select("*");

  if (budgetsError) throw budgetsError;

  // Get all expenses for the current user's groups
  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select(`
      amount,
      spent_at,
      category_id,
      group_id,
      status,
      categories:category_id (name_ar)
    `)
    .eq("status", "approved");

  if (expensesError) throw expensesError;

  // Calculate total budget
  const totalBudget = budgets?.reduce((sum, budget) => sum + (budget.amount_limit || budget.total_amount), 0) || 0;

  // Calculate total spent (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentExpenses = expenses?.filter(expense => 
    new Date(expense.spent_at) >= thirtyDaysAgo
  ) || [];

  const totalSpent = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const spendingPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Category breakdown
  const categoryMap = new Map();
  
  // Initialize with budget categories
  budgets?.forEach(budget => {
    if (budget.category_id) {
      categoryMap.set(budget.category_id, {
        category: "فئة غير محددة",
        budgeted: budget.amount_limit || budget.total_amount,
        spent: 0,
        remaining: budget.amount_limit || budget.total_amount
      });
    }
  });

  // Add spending data
  recentExpenses.forEach(expense => {
    if (expense.category_id) {
      const existing = categoryMap.get(expense.category_id);
      if (existing) {
        existing.spent += expense.amount;
        existing.remaining = Math.max(0, existing.budgeted - existing.spent);
        existing.category = expense.categories?.name_ar || "فئة غير محددة";
      } else {
        categoryMap.set(expense.category_id, {
          category: expense.categories?.name_ar || "فئة غير محددة",
          budgeted: 0,
          spent: expense.amount,
          remaining: 0
        });
      }
    }
  });

  const categoryBreakdown = Array.from(categoryMap.values());

  // Monthly spending for the last 6 months
  const monthlySpending = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthExpenses = expenses?.filter(expense => {
      const expenseDate = new Date(expense.spent_at);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    }) || [];
    
    const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    monthlySpending.push({
      month: date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }),
      amount: monthTotal
    });
  }

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    spendingPercentage,
    categoryBreakdown,
    monthlySpending
  };
}

export function useBudgetAnalytics() {
  return useQuery({
    queryKey: ["budget-analytics"],
    queryFn: fetchBudgetAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}