import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMemberActions = () => {
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  const removeMember = async (groupId: string, userId: string, memberName: string) => {
    try {
      setRemoving(true);

      // Check if member has any paid expenses or expenses owed
      const { data: paidExpenses, error: paidError } = await supabase
        .from('expenses')
        .select('id, amount, description')
        .eq('group_id', groupId)
        .eq('payer_id', userId)
        .eq('status', 'approved');

      if (paidError) throw paidError;

      const { data: splitExpenses, error: splitError } = await supabase
        .from('expense_splits')
        .select('expense_id, share_amount')
        .in('expense_id', 
          (await supabase
            .from('expenses')
            .select('id')
            .eq('group_id', groupId)
            .eq('status', 'approved')
          ).data?.map(e => e.id) || []
        )
        .eq('member_id', userId);

      if (splitError) throw splitError;

      const totalPaid = paidExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const totalOwed = splitExpenses?.reduce((sum, split) => sum + Number(split.share_amount), 0) || 0;
      const netBalance = totalPaid - totalOwed;

      if (Math.abs(netBalance) > 0) {
        toast({
          title: "لا يمكن إزالة العضو",
          description: `${memberName} لديه رصيد ${netBalance > 0 ? 'مستحق' : 'مدين'} بمبلغ ${Math.abs(netBalance).toLocaleString()} ر.س. يجب تسوية الحساب أولاً.`,
          variant: "destructive",
        });
        return false;
      }

      // Remove member from group
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "تم إزالة العضو",
        description: `تم إزالة ${memberName} من المجموعة`,
      });

      return true;
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "تعذر إزالة العضو",
        description: error.message || "حدث خطأ أثناء إزالة العضو",
        variant: "destructive",
      });
      return false;
    } finally {
      setRemoving(false);
    }
  };

  return {
    removeMember,
    removing,
  };
};