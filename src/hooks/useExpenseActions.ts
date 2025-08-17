import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useExpenseActions = () => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const deleteExpense = async (expenseId: string) => {
    try {
      setDeleting(true);

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

      toast({
        title: "تم حذف المصروف",
        description: "تم حذف المصروف بنجاح",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({
        title: "تعذر حذف المصروف",
        description: error.message || "حدث خطأ أثناء حذف المصروف",
        variant: "destructive",
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleteExpense,
    deleting,
  };
};