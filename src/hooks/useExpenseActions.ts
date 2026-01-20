import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUsageCredits } from '@/hooks/useUsageCredits';

interface DeleteExpenseResult {
  success: boolean;
  needsPaywall?: boolean;
  error?: string;
}

export const useExpenseActions = () => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { checkCredits, consumeCredits, getActionCost } = useUsageCredits();

  const deleteExpense = async (expenseId: string): Promise<DeleteExpenseResult> => {
    try {
      setDeleting(true);

      // Check credits first
      const creditCheck = await checkCredits('delete_expense');
      if (!creditCheck.canPerform) {
        if (creditCheck.blocked) {
          return { success: false, needsPaywall: true };
        }
        toast({
          title: "رصيد غير كافٍ",
          description: "لا تملك نقاط كافية لحذف المصروف",
          variant: "destructive",
        });
        return { success: false, error: "insufficient_credits" };
      }

      // Delete expense splits first
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expenseId);

      if (splitsError) {
        throw splitsError;
      }

      // Delete expense receipts
      const { error: receiptsError } = await supabase
        .from('expense_receipts')
        .delete()
        .eq('expense_id', expenseId);

      if (receiptsError) {
        throw receiptsError;
      }

      // Delete the expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (expenseError) {
        throw expenseError;
      }

      // Consume credits after successful deletion
      await consumeCredits('delete_expense');

      toast({
        title: "تم حذف المصروف",
        description: "تم حذف المصروف بنجاح",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({
        title: "تعذر حذف المصروف",
        description: error.message || "حدث خطأ أثناء حذف المصروف",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setDeleting(false);
    }
  };

  const deleteCost = getActionCost('delete_expense')?.cost || 1;

  return {
    deleteExpense,
    deleting,
    deleteCost,
  };
};