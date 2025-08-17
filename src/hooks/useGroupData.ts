
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type GroupRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string | null;
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
};

export const useGroupData = (groupId?: string) => {
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

  const load = async () => {
    const isValidUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    if (!groupId || !isValidUUID(groupId)) {
      setError("معرف المجموعة غير صالح");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    console.log("[useGroupData] loading for group:", groupId);

    try {

    // 1) المجموعة
    const { data: grp, error: grpErr } = await supabase
      .from("groups")
      .select("id, name, owner_id, created_at")
      .eq("id", groupId)
      .maybeSingle();
    if (grpErr) {
      console.error("[useGroupData] groups error", grpErr);
      throw new Error(`فشل في جلب بيانات المجموعة: ${grpErr.message}`);
    }
    if (!grp) {
      throw new Error("المجموعة غير موجودة أو ليس لديك صلاحية للوصول إليها");
    }
    setGroup(grp as GroupRow);

    // 2) الأعضاء
    const { data: mems, error: memErr } = await supabase
      .from("group_members")
      .select("user_id, role, can_approve_expenses")
      .eq("group_id", groupId);
    if (memErr) {
      console.error("[useGroupData] members error", memErr);
      throw new Error(`فشل في جلب أعضاء المجموعة: ${memErr.message}`);
    }
    const memberRows = (mems as MemberRow[]) ?? [];
    setMembers(memberRows);

    // 3) البروفايلات
    const ids = Array.from(new Set(memberRows.map((m) => m.user_id).filter(Boolean)));
    let profilesMap: Record<string, ProfileRow> = {};
    if (ids.length) {
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, display_name, name, avatar_url, phone, is_admin")
        .in("id", ids);
      if (profErr) {
        console.error("[useGroupData] profiles error", profErr);
        // لا نوقف التحميل بسبب سياسة RLS المحتملة، نواصل دون أسماء
      } else {
        profilesMap = (profs as ProfileRow[]).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, ProfileRow>);
      }
    }
    setProfiles(profilesMap);

    // 4) المصاريف مع أسباب الرفض
    const { data: exps, error: expErr } = await supabase
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
      .order("spent_at", { ascending: false });
    if (expErr) {
      console.error("[useGroupData] expenses error", expErr);
      throw new Error(`فشل في جلب المصروفات: ${expErr.message}`);
    }
    setExpenses((exps as ExpenseRow[]) ?? []);

    // 5) التحويلات (التسويات)
    const { data: sets, error: setErr } = await supabase
      .from("settlements")
      .select("id, group_id, from_user_id, to_user_id, amount, note, created_by, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (setErr) {
      console.error("[useGroupData] settlements error", setErr);
      // لا نوقف التحميل؛ نعرض الصفحة بدون التسويات
      setSettlements([]);
    } else {
      setSettlements((sets as SettlementRow[]) ?? []);
    }

    // 6) الأرصدة المعتمدة (الدالة التجميعية)
    const { data: bal, error: balErr } = await supabase.rpc("get_group_balance", { p_group_id: groupId });
    if (balErr) {
      console.error("[useGroupData] balance rpc error", balErr);
      // ليست حرجة لعرض الصفحة؛ نكمّل بدونها
      setBalances([]);
    } else {
      setBalances((bal as BalanceRow[]) ?? []);
    }

    // 7) المبالغ المعلقة
    const { data: pending, error: pendingErr } = await supabase.rpc("get_pending_amounts", { p_group_id: groupId });
    if (pendingErr) {
      console.error("[useGroupData] pending amounts rpc error", pendingErr);
      setPendingAmounts([]);
    } else {
      setPendingAmounts((pending as PendingAmountRow[]) ?? []);
    }

    // 8) ملخص الأرصدة الشامل
    const { data: summary, error: summaryErr } = await supabase.rpc("get_balance_summary", { p_group_id: groupId });
    if (summaryErr) {
      console.error("[useGroupData] balance summary rpc error", summaryErr);
      setBalanceSummary([]);
    } else {
      setBalanceSummary((summary as BalanceSummaryRow[]) ?? []);
    }

    setLoading(false);
    } catch (err: any) {
      console.error("[useGroupData] load error:", err);
      setError(err.message || "حدث خطأ غير متوقع");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!groupId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

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
          // Refresh data when expenses change
          load();
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
          // Refresh data when settlements change
          load();
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
              load();
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
  }, [groupId, realtimeInitialized, expenses]);

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
