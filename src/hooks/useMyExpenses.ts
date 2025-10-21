import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MyExpense {
  id: string;
  amount: number;
  currency: string;
  description: string;
  note_ar: string;
  status: 'pending' | 'approved' | 'rejected';
  spent_at: string;
  created_at: string;
  payer_id: string;
  created_by: string;
  group_id: string;
  category_id?: string;
  group_name: string;
  group_currency: string;
  category_name?: string;
  category_icon?: string;
  splits: Array<{
    member_id: string;
    share_amount: number;
    member_name: string;
  }>;
}

export interface ExpenseFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  group_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface ExpenseStats {
  total_paid: number;
  total_owed: number;
  total_net: number;
  pending_paid: number;
  pending_owed: number;
  approved_paid: number;
  approved_owed: number;
  rejected_count: number;
  total_count: number;
  groups_count: number;
}

const useMyExpenses = (userId?: string) => {
  const [expenses, setExpenses] = useState<MyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 20;

  const fetchExpenses = useCallback(async (reset = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Single optimized query combining all expense sources
      let query = supabase
        .from('expenses')
        .select(`
          *,
          groups!inner(name, currency),
          categories(name_ar, icon),
          expense_splits(
            member_id,
            share_amount,
            profiles(name, display_name)
          )
        `)
        .or(`created_by.eq.${userId},payer_id.eq.${userId},expense_splits.member_id.eq.${userId}`)
        .order('spent_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.group_id) {
        query = query.eq('group_id', filters.group_id);
      }
      if (filters.date_from) {
        query = query.gte('spent_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('spent_at', filters.date_to);
      }
      if (filters.min_amount) {
        query = query.gte('amount', filters.min_amount);
      }
      if (filters.max_amount) {
        query = query.lte('amount', filters.max_amount);
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,note_ar.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = reset ? 0 : (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      const transformedExpenses: MyExpense[] = (data || []).map((expense: any) => ({
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description || expense.note_ar || '',
        note_ar: expense.note_ar || '',
        status: expense.status,
        spent_at: expense.spent_at,
        created_at: expense.created_at,
        payer_id: expense.payer_id,
        created_by: expense.created_by,
        group_id: expense.group_id,
        category_id: expense.category_id,
        group_name: expense.groups?.name || '',
        group_currency: expense.groups?.currency || 'SAR',
        category_name: expense.categories?.name_ar,
        category_icon: expense.categories?.icon,
        splits: expense.expense_splits?.map((split: any) => ({
          member_id: split.member_id,
          share_amount: split.share_amount,
          member_name: split.profiles?.display_name || split.profiles?.name || 'مستخدم'
        })) || []
      }));

      if (reset) {
        setExpenses(transformedExpenses);
      } else {
        setExpenses(prev => [...prev, ...transformedExpenses]);
      }

      setHasMore((count || 0) > (reset ? transformedExpenses.length : expenses.length + transformedExpenses.length));

    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'حدث خطأ في تحميل المصاريف');
      toast({
        title: "خطأ",
        description: "فشل في تحميل المصاريف",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, filters, page, toast, expenses.length]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const applyFilters = useCallback((newFilters: ExpenseFilters) => {
    setFilters(newFilters);
    setPage(1);
    setExpenses([]);
  }, []);

  const refreshExpenses = useCallback(() => {
    setPage(1);
    fetchExpenses(true);
  }, [fetchExpenses]);

  // Stats calculation
  const stats = useMemo((): ExpenseStats => {
    if (!userId) {
      return {
        total_paid: 0,
        total_owed: 0,
        total_net: 0,
        pending_paid: 0,
        pending_owed: 0,
        approved_paid: 0,
        approved_owed: 0,
        rejected_count: 0,
        total_count: 0,
        groups_count: 0
      };
    }

    return expenses.reduce((acc, expense) => {
      const userSplit = expense.splits.find(split => split.member_id === userId);
      const shareAmount = userSplit?.share_amount || 0;
      const isPayer = expense.payer_id === userId;

      acc.total_count++;

      if (expense.status === 'approved') {
        if (isPayer) acc.approved_paid += expense.amount;
        acc.approved_owed += shareAmount;
      } else if (expense.status === 'pending') {
        if (isPayer) acc.pending_paid += expense.amount;
        acc.pending_owed += shareAmount;
      } else if (expense.status === 'rejected') {
        acc.rejected_count++;
      }

      if (isPayer) acc.total_paid += expense.amount;
      acc.total_owed += shareAmount;

      return acc;
    }, {
      total_paid: 0,
      total_owed: 0,
      total_net: 0,
      pending_paid: 0,
      pending_owed: 0,
      approved_paid: 0,
      approved_owed: 0,
      rejected_count: 0,
      total_count: 0,
      groups_count: new Set(expenses.map(e => e.group_id)).size
    });
  }, [expenses, userId]);

  stats.total_net = stats.total_paid - stats.total_owed;

  // Real-time updates - lazy initialization
  useEffect(() => {
    // Only subscribe after initial load
    if (!loading && expenses.length > 0 && userId) {
      const channel = supabase
        .channel('my-expenses-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'expenses'
        }, () => {
          refreshExpenses();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'expense_splits'
        }, () => {
          refreshExpenses();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loading, expenses.length, userId, refreshExpenses]);

  useEffect(() => {
    fetchExpenses(true);
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    stats,
    filters,
    hasMore,
    applyFilters,
    loadMore,
    refreshExpenses
  };
};

export default useMyExpenses;