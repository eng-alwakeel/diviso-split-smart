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

const useMyExpenses = () => {
  const [expenses, setExpenses] = useState<MyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 20;

  // Get current user ID once
  useEffect(() => {
    let mounted = true;
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !mounted) return;
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Failed to get user in useMyExpenses:', error);
      }
    };
    
    getCurrentUser();
    return () => { mounted = false; };
  }, []);

  const fetchExpenses = useCallback(async (reset = false) => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Use cached currentUserId instead of fetching again
      const userId = currentUserId;

      // First, get expenses where user is creator or payer
      const createdOrPaidQuery = supabase
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
        .or(`created_by.eq.${userId},payer_id.eq.${userId}`)
        .order('spent_at', { ascending: false });

      // Then, get expenses where user has a split
      const splitQuery = supabase
        .from('expenses')
        .select(`
          *,
          groups!inner(name, currency),
          categories(name_ar, icon),
          expense_splits!inner(
            member_id,
            share_amount,
            profiles(name, display_name)
          )
        `)
        .eq('expense_splits.member_id', userId)
        .order('spent_at', { ascending: false });

      // Apply filters to both queries
      const applyFiltersToQuery = (query: any) => {
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
        return query;
      };

      // Apply pagination
      const currentPage = reset ? 1 : page;
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const filteredCreatedOrPaidQuery = applyFiltersToQuery(createdOrPaidQuery).range(from, to);
      const filteredSplitQuery = applyFiltersToQuery(splitQuery).range(from, to);

      // Execute both queries
      const [createdOrPaidResult, splitResult] = await Promise.all([
        filteredCreatedOrPaidQuery,
        filteredSplitQuery
      ]);

      if (createdOrPaidResult.error) throw createdOrPaidResult.error;
      if (splitResult.error) throw splitResult.error;

      // Merge and deduplicate results
      const allExpenses = [...(createdOrPaidResult.data || []), ...(splitResult.data || [])];
      const uniqueExpenses = allExpenses.reduce((acc, expense) => {
        if (!acc.find((e: any) => e.id === expense.id)) {
          acc.push(expense);
        }
        return acc;
      }, [] as any[]);

      // Sort by spent_at
      uniqueExpenses.sort((a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime());

      const transformedExpenses: MyExpense[] = uniqueExpenses.map((expense: any) => ({
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
        setPage(1);
      } else {
        setExpenses(prev => {
          // Deduplicate when adding more
          const existingIds = new Set(prev.map(e => e.id));
          const newExpenses = transformedExpenses.filter(e => !existingIds.has(e.id));
          return [...prev, ...newExpenses];
        });
      }

      setHasMore(transformedExpenses.length === ITEMS_PER_PAGE);
      setInitialFetchDone(true);

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
  }, [currentUserId, filters, page, toast]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const applyNewFilters = useCallback((newFilters: ExpenseFilters) => {
    setFilters(newFilters);
    setPage(1);
    setExpenses([]);
    setInitialFetchDone(false);
  }, []);

  const refreshExpenses = useCallback(() => {
    fetchExpenses(true);
  }, [fetchExpenses]);

  // Stats calculation
  const stats = useMemo((): ExpenseStats => {
    const result = expenses.reduce((acc, expense) => {
      const userSplit = expense.splits.find(split => split.member_id === currentUserId);
      const shareAmount = userSplit?.share_amount || 0;
      const isPayer = expense.payer_id === currentUserId;

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
    
    result.total_net = result.total_paid - result.total_owed;
    return result;
  }, [expenses, currentUserId]);

  // Real-time updates with debounce
  useEffect(() => {
    if (!currentUserId) return;
    
    let debounceTimer: NodeJS.Timeout;
    
    const channel = supabase
      .channel('my-expenses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses'
      }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchExpenses(true);
        }, 500);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expense_splits'
      }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchExpenses(true);
        }, 500);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchExpenses]);

  // Initial fetch - only when user ID is available and not done yet
  useEffect(() => {
    if (currentUserId && !initialFetchDone) {
      fetchExpenses(true);
    }
  }, [currentUserId, initialFetchDone, fetchExpenses]);

  // Page change fetch
  useEffect(() => {
    if (currentUserId && initialFetchDone && page > 1) {
      fetchExpenses(false);
    }
  }, [page, currentUserId, initialFetchDone, fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    stats,
    filters,
    hasMore,
    applyFilters: applyNewFilters,
    loadMore,
    refreshExpenses,
    currentUserId
  };
};

export default useMyExpenses;