
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
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
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
};

type BalanceRow = {
  user_id: string;
  amount_paid: number | null;
  amount_owed: number | null;
  settlements_in: number | null;
  settlements_out: number | null;
  net_balance: number | null;
};

export const useGroupData = (groupId?: string) => {
  const [loading, setLoading] = useState<boolean>(!!groupId);
  const [error, setError] = useState<string | null>(null);

  const [group, setGroup] = useState<GroupRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);

  const load = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    console.log("[useGroupData] loading for group:", groupId);

    // 1) المجموعة
    const { data: grp, error: grpErr } = await supabase
      .from("groups")
      .select("id, name, owner_id, created_at")
      .eq("id", groupId)
      .maybeSingle();
    if (grpErr) {
      console.error("[useGroupData] groups error", grpErr);
      setError(grpErr.message);
      setLoading(false);
      return;
    }
    setGroup(grp as GroupRow);

    // 2) الأعضاء
    const { data: mems, error: memErr } = await supabase
      .from("group_members")
      .select("user_id, role")
      .eq("group_id", groupId);
    if (memErr) {
      console.error("[useGroupData] members error", memErr);
      setError(memErr.message);
      setLoading(false);
      return;
    }
    const memberRows = (mems as MemberRow[]) ?? [];
    setMembers(memberRows);

    // 3) البروفايلات
    const ids = Array.from(new Set(memberRows.map((m) => m.user_id).filter(Boolean)));
    let profilesMap: Record<string, ProfileRow> = {};
    if (ids.length) {
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, display_name, name, avatar_url")
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

    // 4) المصاريف
    const { data: exps, error: expErr } = await supabase
      .from("expenses")
      .select("id, group_id, description, amount, spent_at, created_at, payer_id, status, currency")
      .eq("group_id", groupId)
      .order("spent_at", { ascending: false });
    if (expErr) {
      console.error("[useGroupData] expenses error", expErr);
      setError(expErr.message);
      setLoading(false);
      return;
    }
    setExpenses((exps as ExpenseRow[]) ?? []);

    // 5) الأرصدة (الدالة التجميعية)
    const { data: bal, error: balErr } = await supabase.rpc("get_group_balance", { p_group_id: groupId });
    if (balErr) {
      console.error("[useGroupData] balance rpc error", balErr);
      // ليست حرجة لعرض الصفحة؛ نكمّل بدونها
      setBalances([]);
    } else {
      setBalances((bal as BalanceRow[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!groupId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return { totalExpenses };
  }, [expenses]);

  return {
    loading,
    error,
    group,
    members,
    profiles,
    expenses,
    balances,
    totals,
    refetch: load,
  };
};
