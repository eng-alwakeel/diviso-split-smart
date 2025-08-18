import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BudgetWarning = {
  warning_type: 'exceed' | 'depletion' | 'savings' | 'normal';
  message: string;
  current_spent: number;
  budget_limit: number;
  remaining_amount: number;
};

export const useBudgetWarnings = () => {
  return useMutation({
    mutationFn: async ({
      groupId,
      categoryId,
      amount
    }: {
      groupId: string;
      categoryId: string;
      amount: number;
    }): Promise<BudgetWarning | null> => {
      const { data, error } = await supabase
        .rpc('get_budget_warnings', {
          p_group_id: groupId,
          p_category_id: categoryId,
          p_amount: amount
        });

      if (error) throw error;

      return data?.[0] as BudgetWarning | null || null;
    }
  });
};