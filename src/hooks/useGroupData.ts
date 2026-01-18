
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePerformanceOptimization } from "./usePerformanceOptimization";

type GroupRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string | null;
  group_type?: string;
  currency: string;
};

type MemberRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
  can_approve_expenses: boolean;
  profile?: ProfileRow | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_admin: boolean;
};

type ExpenseRow = {
  id: string;
  group_id: string;
  description: string | null;
  amount: number;
  spent_at: string | null;
  created_at: string | null;
  payer_id: string | null;
  status: "pending" | "approved" | "rejected";
  currency: string;
  category_id: string | null;
  expense_rejections?: Array<{
    rejection_reason: string | null;
    rejected_at: string;
    rejected_by: string;
  }>;
};

type BalanceRow = {
  user_id: string;
  amount_paid: number | null;
  amount_owed: number | null;
  settlements_in: number | null;
  settlements_out: number | null;
  net_balance: number | null;
};

type PendingAmountRow = {
  user_id: string;
  pending_paid: number;
  pending_owed: number;
  pending_net: number;
};

type BalanceSummaryRow = {
  user_id: string;
  confirmed_paid: number;
  confirmed_owed: number;
  confirmed_net: number;
  pending_paid: number;
  pending_owed: number;
  pending_net: number;
  total_net: number;
};

type SettlementRow = {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  note: string | null;
  created_by: string;
  created_at: string | null;
  status?: string | null;
  dispute_reason?: string | null;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
};

export const useGroupData = (groupId?: string) => {
  const { createCache, debounce, measurePerformance } = usePerformanceOptimization();
  const cache = useMemo(() => createCache(20), [createCache]);
  const loadingRef = useRef(false);
  
  const [loading, setLoading] = useState<boolean>(!!groupId);
  const [error, setError] = useState<string | null>(null);

  const [group, setGroup] = useState<GroupRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [pendingAmounts, setPendingAmounts] = useState<PendingAmountRow[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummaryRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [realtimeInitialized, setRealtimeInitialized] = useState(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return; // Prevent duplicate calls
    
    const isValidUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    if (!groupId || !isValidUUID(groupId)) {
      setError("معرف المجموعة غير صالح");
      setLoading(false);
      return;
    }

    const cacheKey = `group-${groupId}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      setGroup(cachedData.group);
      setMembers(cachedData.members);
      setProfiles(cachedData.profiles);
      setExpenses(cachedData.expenses);
      setBalances(cachedData.balances);
      setPendingAmounts(cachedData.pendingAmounts);
      setBalanceSummary(cachedData.balanceSummary);
      setSettlements(cachedData.settlements);
      setLoading(false);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    console.log("[useGroupData] loading for group:", groupId);

    try {
      // Parallel data fetching for better performance
      const [
        groupResult,
        membersResult,
        expensesResult,
        settlementsResult
      ] = await Promise.all([
        // 1) المجموعة
        supabase
          .from("groups")
          .select("id, name, owner_id, created_at, group_type, currency")
          .eq("id", groupId)
          .maybeSingle(),
        
        // 2) الأعضاء
        supabase
          .from("group_members")
          .select("user_id, role, can_approve_expenses")
          .eq("group_id", groupId),
        
        // 3) المصاريف مع أسباب الرفض (مع limit للأداء)
        supabase
          .from("expenses")
          .select(`
            id, group_id, description, amount, spent_at, created_at, payer_id, status, currency, category_id,
            expense_rejections (
              rejection_reason,
              rejected_at,
              rejected_by
            )
          `)
          .eq("group_id", groupId)
          .order("spent_at", { ascending: false })
          .limit(100), // Limit to improve performance
        
        // 4) التسويات مع حالة التأكيد
        supabase
          .from("settlements")
          .select("id, group_id, from_user_id, to_user_id, amount, note, created_by, created_at, status, dispute_reason, confirmed_at, confirmed_by")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
          .limit(50) // Limit settlements
      ]);

      // Check group data
      if (groupResult.error) {
        console.error("[useGroupData] groups error", groupResult.error);
        throw new Error(`فشل في جلب بيانات المجموعة: ${groupResult.error.message}`);
      }
      if (!groupResult.data) {
        throw new Error("المجموعة غير موجودة أو ليس لديك صلاحية للوصول إليها");
      }
      const grp = groupResult.data as GroupRow;
      setGroup(grp);

      // Check members
      if (membersResult.error) {
        console.error("[useGroupData] members error", membersResult.error);
        throw new Error(`فشل في جلب أعضاء المجموعة: ${membersResult.error.message}`);
      }
      const memberRows = (membersResult.data as MemberRow[]) ?? [];
      setMembers(memberRows);

      // Get profiles for members
      const ids = Array.from(new Set(memberRows.map((m) => m.user_id).filter(Boolean)));
      let profilesMap: Record<string, ProfileRow> = {};
      if (ids.length) {
        const { data: profs, error: profErr } = await supabase
          .from("profiles")
          .select("id, display_name, name, avatar_url, phone, is_admin")
          .in("id", ids);
        if (!profErr && profs) {
          profilesMap = profs.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, ProfileRow>);
        }
      }
      setProfiles(profilesMap);

      // Set expenses
      if (expensesResult.error) {
        console.error("[useGroupData] expenses error", expensesResult.error);
        setExpenses([]);
      } else {
        setExpenses((expensesResult.data as ExpenseRow[]) ?? []);
      }

      // Set settlements
      if (settlementsResult.error) {
        console.error("[useGroupData] settlements error", settlementsResult.error);
        setSettlements([]);
      } else {
        setSettlements((settlementsResult.data as SettlementRow[]) ?? []);
      }

      // Parallel RPC calls for balance data
      const [balanceResult, pendingResult, summaryResult] = await Promise.all([
        supabase.rpc("get_group_balance", { p_group_id: groupId }),
        supabase.rpc("get_pending_amounts", { p_group_id: groupId }),
        supabase.rpc("get_balance_summary", { p_group_id: groupId })
      ]);

      // Set balance data
      setBalances(balanceResult.error ? [] : (balanceResult.data as BalanceRow[]) ?? []);
      setPendingAmounts(pendingResult.error ? [] : (pendingResult.data as PendingAmountRow[]) ?? []);
      setBalanceSummary(summaryResult.error ? [] : (summaryResult.data as BalanceSummaryRow[]) ?? []);

      // Cache the results
      const cacheData = {
        group: grp,
        members: memberRows,
        profiles: profilesMap,
        expenses: expensesResult.data ?? [],
        balances: balanceResult.data ?? [],
        pendingAmounts: pendingResult.data ?? [],
        balanceSummary: summaryResult.data ?? [],
        settlements: settlementsResult.data ?? []
      };
      cache.set(cacheKey, cacheData);

    setLoading(false);
    } catch (err: any) {
      console.error("[useGroupData] load error:", err);
      setError(err.message || "حدث خطأ غير متوقع");
      setLoading(false);
    } finally {
      loadingRef.current = false;
    }
  }, [groupId, cache]);

  useEffect(() => {
    if (!groupId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Debounced load function for real-time updates
  const debouncedLoad = useMemo(
    () => debounce(load, 500),
    [debounce, load]
  );

  // Real-time updates for balance-affecting tables
  useEffect(() => {
    if (!groupId || realtimeInitialized) return;
    
    console.log("[useGroupData] Setting up realtime listeners for group:", groupId);
    
    const expensesChannel = supabase
      .channel(`expenses_${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` },
        (payload) => {
          console.log("[useGroupData] Expenses change:", payload);
          // Clear cache and refresh data
          cache.clear();
          debouncedLoad();
        }
      )
      .subscribe();

    const settlementsChannel = supabase
      .channel(`settlements_${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${groupId}` },
        (payload) => {
          console.log("[useGroupData] Settlements change:", payload);
          cache.clear();
          debouncedLoad();
        }
      )
      .subscribe();

    const splitsChannel = supabase
      .channel(`expense_splits_${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_splits' },
        (payload) => {
          console.log("[useGroupData] Expense splits change:", payload);
          // Check if this split is for an expense in our group
          if (payload.new || payload.old) {
            const expenseId = (payload.new as any)?.expense_id || (payload.old as any)?.expense_id;
            if (expenseId && expenses.some(e => e.id === expenseId)) {
              cache.clear();
              debouncedLoad();
            }
          }
        }
      )
      .subscribe();

    setRealtimeInitialized(true);

    return () => {
      console.log("[useGroupData] Cleaning up realtime listeners");
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(settlementsChannel);
      supabase.removeChannel(splitsChannel);
      setRealtimeInitialized(false);
    };
  }, [groupId, realtimeInitialized, expenses, cache, debouncedLoad]);

  const totals = useMemo(() => {
    const approvedExpenses = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount || 0), 0);
    const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount || 0), 0);
    const rejectedExpenses = expenses.filter(e => e.status === 'rejected').reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalExpenses = approvedExpenses; // Only count approved expenses in total
    
    return {
      totalExpenses,
      approvedExpenses,
      pendingExpenses,
      rejectedExpenses,
    };
  }, [expenses]);

return {
  loading,
  error,
  group,
  members,
  profiles,
  expenses,
  balances,
  pendingAmounts,
  balanceSummary,
  settlements,
  totals,
  refetch: load,
};
};
