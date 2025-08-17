import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CategorySuggestion {
  category_id: string | null;
  category_name: string;
  suggested_amount: number;
  percentage: number;
  reason: string;
  confidence: number;
  is_new_category: boolean;
}

export const useBudgetFromAI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBudgetFromAISuggestions = async (
    groupId: string,
    budgetName: string,
    totalAmount: number,
    suggestions: CategorySuggestion[]
  ) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create the main budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert([{
          name: budgetName,
          total_amount: totalAmount,
          amount_limit: totalAmount,
          start_date: new Date().toISOString().split('T')[0],
          period: 'monthly' as const,
          budget_type: 'monthly' as const,
          group_id: groupId,
          created_by: user.id
        }])
        .select('id')
        .single();

      if (budgetError) throw budgetError;

      // 2. Process each suggestion and create budget categories
      for (const suggestion of suggestions) {
        let categoryId = suggestion.category_id;

        // If it's a new category, create it first
        if (suggestion.is_new_category || !categoryId) {
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert([{ 
              name_ar: suggestion.category_name, 
              created_by: user.id 
            }])
            .select('id')
            .single();

          if (categoryError) {
            console.error('Error creating category:', categoryError);
            continue;
          }
          categoryId = newCategory.id;
        }

        // Create budget category with proper category_id link
        const { error: budgetCategoryError } = await supabase
          .from('budget_categories')
          .insert([{
            name: suggestion.category_name,
            allocated_amount: suggestion.suggested_amount,
            budget_id: budget.id,
            category_id: categoryId
          }]);

        if (budgetCategoryError) {
          console.error('Error creating budget category:', budgetCategoryError);
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
      queryClient.invalidateQueries({ queryKey: ["group-budget-tracking"] });

      toast({
        title: 'نجح!',
        description: 'تم إنشاء الميزانية بنجاح مع جميع الفئات',
      });

      return budget.id;

    } catch (error: any) {
      console.error('Error creating budget from AI suggestions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الميزانية: ' + error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createBudgetFromAISuggestions
  };
};