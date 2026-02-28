import { useMemo } from 'react';
import { MyExpense } from './useMyExpenses';

export interface GroupBalance {
  group_id: string;
  group_name: string;
  currency: string;
  net: number;
}

export const useGroupBalances = (expenses: MyExpense[], currentUserId: string) => {
  const { receivableGroups, payableGroups } = useMemo(() => {
    const groupMap = new Map<string, GroupBalance>();

    for (const expense of expenses) {
      if (expense.status === 'rejected') continue;

      const existing = groupMap.get(expense.group_id) || {
        group_id: expense.group_id,
        group_name: expense.group_name,
        currency: expense.group_currency || expense.currency,
        net: 0,
      };

      const isPayer = expense.payer_id === currentUserId;
      const userSplit = expense.splits.find(s => s.member_id === currentUserId);
      const shareAmount = userSplit?.share_amount || 0;

      existing.net += (isPayer ? expense.amount : 0) - shareAmount;
      groupMap.set(expense.group_id, existing);
    }

    const all = Array.from(groupMap.values());
    const receivableGroups = all
      .filter(g => g.net > 0)
      .sort((a, b) => b.net - a.net);
    const payableGroups = all
      .filter(g => g.net < 0)
      .sort((a, b) => a.net - b.net);

    return { receivableGroups, payableGroups };
  }, [expenses, currentUserId]);

  return { receivableGroups, payableGroups };
};
