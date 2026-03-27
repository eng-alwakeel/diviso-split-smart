import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  ArrowRight, Users, Receipt, Wallet, Plus, Settings,
  DollarSign, MoreHorizontal, UserPlus, Edit, CheckCircle, Clock,
  XCircle, Shield, FileText, Trash2, AlertTriangle, LogOut, Flag, RotateCcw, Scale,
  ArrowDownCircle, ArrowUpCircle, CheckCircle2, Lightbulb, ChevronLeft
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { InviteManagementDialog } from "@/components/group/InviteManagementDialog";
import { PendingInvitesSection } from "@/components/group/PendingInvitesSection";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { GroupChat } from "@/components/group/GroupChat";
import { supabase } from "@/integrations/supabase/client";
import { useGroupData } from "@/hooks/useGroupData";
import { GroupReportDialog } from "@/components/group/GroupReportDialog";
import { GroupSettlementDialog } from "@/components/group/GroupSettlementDialog";
import { SettlementGuardDialog } from "@/components/group/SettlementGuardDialog";
import { EditExpenseDialog } from "@/components/group/EditExpenseDialog";
import { RejectExpenseDialog } from "@/components/group/RejectExpenseDialog";
import { ExpenseDetailsDialog } from "@/components/group/ExpenseDetailsDialog";
import { BalanceDashboard } from "@/components/group/BalanceDashboard";
import { MemberCard } from "@/components/group/MemberCard";
import { PendingMemberCard } from "@/components/group/PendingMemberCard";
import { PlanBadge } from "@/components/ui/plan-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useMemberSubscriptions } from "@/hooks/useMemberSubscriptions";
import { useExpenseActions } from "@/hooks/useExpenseActions";
import { useCurrencies } from "@/hooks/useCurrencies";
import { DeleteGroupDialog } from "@/components/group/DeleteGroupDialog";
import { LeaveGroupDialog } from "@/components/group/LeaveGroupDialog";
import { CloseGroupDialog } from "@/components/group/CloseGroupDialog";
import { PendingRatingsNotification } from "@/components/group/PendingRatingsNotification";
import { RatingSheet } from "@/components/group/RatingSheet";
import { useGroupNotifications } from "@/hooks/useGroupNotifications";
import { useGroupStatus } from "@/hooks/useGroupStatus";
import { useTranslation } from "react-i18next";
import { ProfileCompletionSheet } from "@/components/profile/ProfileCompletionSheet";
import { GroupStateBadge, type GroupState } from "@/components/group/GroupStatusBanner";
import { FinishGroupDialog } from "@/components/group/FinishGroupDialog";
import { RequestPaymentDialog } from "@/components/group/RequestPaymentDialog";
import { TripSummarySheet } from "@/components/group/TripSummarySheet";
import { PreviousBalanceSheet } from "@/components/group/PreviousBalanceSheet";
import { computeMemberBadges } from "@/components/group/GroupMemberBadges";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGroupSourcePlan } from "@/hooks/useGroupSourcePlan";
import { GroupPlanSection } from "@/components/group/GroupPlanSection";
import { SmartGroupSuggestions } from "@/components/recommendations/SmartGroupSuggestions";
import { Progress } from "@/components/ui/progress";


const GroupDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: rawId } = useParams();
  const [searchParams] = useSearchParams();
  const [openInvite, setOpenInvite] = useState(false);
  
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  useEffect(() => {
    if (searchParams.get('openInvite') === 'true') {
      setOpenInvite(true);
      window.history.replaceState({}, '', `/group/${rawId}`);
    }
    if (searchParams.get('showProfileCompletion') === 'true') {
      setShowProfileCompletion(true);
      window.history.replaceState({}, '', `/group/${rawId}`);
    }
  }, [searchParams, rawId]);

  const [reportOpen, setReportOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settlementGuardOpen, setSettlementGuardOpen] = useState(false);
  const [prefillTo, setPrefillTo] = useState<string | undefined>(undefined);
  const [prefillAmount, setPrefillAmount] = useState<number | undefined>(undefined);
  
  const openSettlement = (toUserId?: string, amount?: number) => {
    setPrefillTo(toUserId);
    setPrefillAmount(amount);
    const hasUnconfirmed = members.some(m => (m as any).status === 'invited' || (m as any).status === 'pending');
    if (hasUnconfirmed) {
      setSettlementGuardOpen(true);
    } else {
      setSettleOpen(true);
    }
  };
  
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [rejectExpenseOpen, setRejectExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<any>(null);
  const [deleteExpenseConfirmOpen, setDeleteExpenseConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [leaveGroupDialogOpen, setLeaveGroupDialogOpen] = useState(false);
  const [closeGroupDialogOpen, setCloseGroupDialogOpen] = useState(false);
  const [finishGroupDialogOpen, setFinishGroupDialogOpen] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false);
  const [memberToRate, setMemberToRate] = useState<any>(null);
  const [requestPaymentOpen, setRequestPaymentOpen] = useState(false);
  const [tripSummaryOpen, setTripSummaryOpen] = useState(false);
  const [previousBalanceOpen, setPreviousBalanceOpen] = useState(false);

  // New sheets for single-flow
  const [membersSheetOpen, setMembersSheetOpen] = useState(false);
  const [settlementDetailsOpen, setSettlementDetailsOpen] = useState(false);
  
  const { t } = useTranslation(['groups', 'common']);
  const { notifyMemberLeft, notifyGroupDeleted, notifySettlementReminder } = useGroupNotifications();

  const isValidUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  const id = rawId && rawId !== ":id" && isValidUUID(rawId) ? rawId : undefined;

  const { closeGroup, closing: closingGroup, finishGroup, finishing: finishingGroup, reopenGroup, reopening: reopeningGroup } = useGroupStatus(id);

  useEffect(() => {
    if (rawId && (rawId === ":id" || !isValidUUID(rawId))) {
      toast({ title: "معرّف المجموعة غير صالح", description: "تمت إعادتك للوحة التحكم.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [rawId, navigate, toast]);

  const { loading, error, group, members, profiles, expenses, balances, pendingAmounts, balanceSummary, settlements, totals, refetch, forceRefresh } = useGroupData(id);
  
  const { isUserOnline, onlineCount } = useOnlinePresence(id);
  const { getPlanBadgeConfig } = usePlanBadge();
  const registeredMembers = useMemo(() => members.filter((m): m is typeof m & { user_id: string } => !!m.user_id), [members]);
  const { subscriptions: memberSubscriptions } = useMemberSubscriptions(registeredMembers.map(m => m.user_id));
  const { formatCurrency, currencies } = useCurrencies();
  const { data: sourcePlan } = useGroupSourcePlan(id);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (group?.name) {
      document.title = `${group.name} - تفاصيل المجموعة`;
    }
  }, [group?.name]);

  useEffect(() => {
    document.body.classList.add('no-scrollbar');
    return () => { document.body.classList.remove('no-scrollbar'); };
  }, []);

  const canApprove = useMemo(() => {
    if (!currentUserId) return false;
    const me = members.find(m => m.user_id === currentUserId);
    return me ? (me.role === "admin" || me.role === "owner" || me.can_approve_expenses) : false;
  }, [members, currentUserId]);

  const isAdmin = useMemo(() => {
    if (!currentUserId) return false;
    const me = members.find(m => m.user_id === currentUserId);
    return me ? (me.role === "admin" || me.role === "owner") : false;
  }, [members, currentUserId]);
  
  const { deleteExpense, deleting: deletingExpense } = useExpenseActions();
  const isOwner = currentUserId != null && group?.owner_id === currentUserId;

  const myBalances = useMemo(() => {
    if (!currentUserId) return { confirmed: 0, pending: 0, total: 0 };
    const confirmed = balances.find(b => b.user_id === currentUserId);
    const pending = pendingAmounts.find(p => p.user_id === currentUserId);
    const summary = balanceSummary.find(s => s.user_id === currentUserId);
    return {
      confirmed: Number(confirmed?.net_balance ?? 0),
      pending: Number(pending?.pending_net ?? 0),
      total: Number(summary?.total_net ?? 0)
    };
  }, [balances, pendingAmounts, balanceSummary, currentUserId]);

  const groupState: GroupState = useMemo(() => {
    const status = group?.status as string | null;
    if (status === 'closed') return 'closed';
    if (status === 'finished') {
      const allZero = balanceSummary.every(b => Math.abs(Number(b.total_net ?? 0)) < 0.01);
      if (allZero && balanceSummary.length > 0) return 'balanced';
      return 'finished';
    }
    const allZero = balanceSummary.every(b => Math.abs(Number(b.total_net ?? 0)) < 0.01);
    if (allZero && balanceSummary.length > 0 && expenses.length > 0) return 'balanced';
    return 'active';
  }, [group?.status, balanceSummary, expenses.length]);

  const isGroupActive = groupState === 'active';
  const isGroupClosed = groupState === 'closed';
  const canAddExpenses = groupState === 'active';

  const groupCurrency = group?.currency || 'SAR';
  const currency = currencies.find(c => c.code === groupCurrency);
  const currencyLabel = currency?.symbol || groupCurrency;
  const memberCount = members.length;
  const nameOf = (uid: string) => (uid ? (profiles[uid]?.display_name || profiles[uid]?.name || `${uid.slice(0,4)}...`) : 'عضو معلق');

  const debtors = useMemo(() => {
    return balanceSummary
      .filter(b => Number(b.total_net ?? 0) < -0.01 && b.user_id !== currentUserId)
      .map(b => ({
        user_id: b.user_id,
        name: nameOf(b.user_id),
        phone: profiles[b.user_id]?.phone || null,
        amount: Math.abs(Number(b.total_net ?? 0)),
      }));
  }, [balanceSummary, currentUserId, profiles]);

  const memberBadges = useMemo(() => {
    const msgCounts: Record<string, number> = {};
    return computeMemberBadges(
      registeredMembers.map(m => m.user_id), balances, settlements, msgCounts,
    );
  }, [registeredMembers, balances, settlements]);

  const tripSummaryData = useMemo(() => {
    const topPayer = balances.length > 0 ? balances.reduce((best, b) => 
      b.amount_paid > (best?.amount_paid ?? 0) ? b : best, balances[0]) : null;
    return {
      groupName: group?.name || "",
      totalExpenses: totals.approvedExpenses,
      currency: currencyLabel,
      memberCount,
      expenseCount: expenses.length,
      settlementCount: settlements.length,
      diceCount: 0,
      topPayer: topPayer ? { name: nameOf(topPayer.user_id), amount: topPayer.amount_paid } : undefined,
    };
  }, [group?.name, totals.approvedExpenses, currencyLabel, memberCount, expenses.length, settlements, balances]);

  // Smart suggestion
  const smartSuggestion = useMemo(() => {
    if (myBalances.confirmed < -0.01 && debtors.length === 0) {
      // User owes money — find who they owe
      const creditors = balanceSummary
        .filter(b => Number(b.total_net ?? 0) > 0.01 && b.user_id !== currentUserId);
      if (creditors.length > 0) {
        const top = creditors.reduce((a, b) => Number(b.total_net ?? 0) > Number(a.total_net ?? 0) ? b : a);
        return `سدد لـ ${nameOf(top.user_id)} ${Math.abs(Number(top.total_net ?? 0)).toLocaleString()} ${currencyLabel}`;
      }
    }
    if (debtors.length > 0 && myBalances.confirmed > 0.01) {
      return `${debtors.length} أعضاء لم يسددوا بعد`;
    }
    if (expenses.length === 0 && memberCount > 1) {
      return "لا يوجد مصاريف — ابدأ بإضافة أول مصروف";
    }
    return null;
  }, [myBalances.confirmed, debtors, balanceSummary, currentUserId, expenses.length, memberCount, currencyLabel]);

  // Preview data
  const previewExpenses = useMemo(() => expenses.slice(0, 3), [expenses]);
  const previewMembers = useMemo(() => registeredMembers.slice(0, 3), [registeredMembers]);

  // Handlers
  const handleDeleteGroup = async () => {
    if (!id || !isOwner || !currentUserId) return;
    setIsDeletingGroup(true);
    await notifyGroupDeleted(id, group?.name || "", currentUserId);
    const { error: deleteError } = await supabase.from("groups").delete().eq("id", id);
    setIsDeletingGroup(false);
    if (deleteError) { toast({ title: t('groups:delete.failed'), variant: "destructive" }); return; }
    toast({ title: t('groups:delete.success') });
    setDeleteGroupDialogOpen(false);
    navigate('/dashboard');
  };

  const handleLeaveGroup = async () => {
    if (!id || !currentUserId || isOwner) return;
    setIsLeavingGroup(true);
    await notifyMemberLeft(id, group?.name || "", currentUserId);
    const { error: leaveError } = await supabase.from("group_members").delete().eq("group_id", id).eq("user_id", currentUserId);
    setIsLeavingGroup(false);
    if (leaveError) { toast({ title: t('groups:settings.leave_failed'), variant: "destructive" }); return; }
    toast({ title: t('groups:settings.left') });
    setLeaveGroupDialogOpen(false);
    navigate('/dashboard');
  };

  const handleExpenseApproval = async (expenseId: string, action: "approve" | "reject") => {
    if (action === "approve") {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) { toast({ title: "تسجيل الدخول مطلوب", variant: "destructive" }); return; }
      const resp = await fetch("https://iwthriddasxzbjddpzzf.functions.supabase.co/approve-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ expense_id: expenseId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast({ title: "تعذر اعتماد المصروف", description: err.error ?? "حدث خطأ غير متوقع", variant: "destructive" });
      } else {
        toast({ title: "تم اعتماد المصروف!" });
        refetch();
      }
      return;
    }
    if (action === "reject") {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) { setSelectedExpense(expense); setRejectExpenseOpen(true); }
    }
  };

  const handleEditExpense = (expense: any) => { setSelectedExpense(expense); setEditExpenseOpen(true); };

  const handleDeleteSettlement = async (settlementId: string) => {
    const { error: delErr } = await supabase.from('settlements').delete().eq('id', settlementId);
    if (delErr) { toast({ title: 'تعذر حذف التسوية', description: delErr.message, variant: 'destructive' }); return; }
    toast({ title: 'تم حذف التسوية' });
    refetch();
  };

  const handleFinishGroup = async () => {
    const success = await finishGroup();
    if (success) { setFinishGroupDialogOpen(false); refetch(); }
  };

  const handleReopenGroup = async () => {
    const success = await reopenGroup();
    if (success) { refetch(); }
  };

  return (
    <div className="min-h-screen bg-dark-background overflow-x-hidden">
      <SEO title={group?.name || "تفاصيل المجموعة"} noIndex={true} />
      <AppHeader />
      
      {/* Dialogs */}
      <InviteManagementDialog 
        open={openInvite} onOpenChange={setOpenInvite} groupId={id} groupName={group?.name}
        existingMembers={registeredMembers.map(m => m.user_id)}
      />
      <GroupReportDialog open={reportOpen} onOpenChange={setReportOpen} groupName={group?.name} groupId={id}
        profiles={profiles} expenses={expenses} balances={balances} totalExpenses={totals.totalExpenses}
      />

      <div className="page-container space-y-4">

        {/* ═══════════ 1️⃣ HEADER ═══════════ */}
        <div className="flex items-center gap-3 py-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/my-groups')} className="shrink-0">
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">{group?.name || "..."}</h1>
              <GroupStateBadge state={groupState} />
            </div>
            {group?.group_type && (
              <p className="text-[11px] text-muted-foreground">{
                ({ trip: "رحلة", home: "سكن مشترك", work: "عمل", party: "حفلة", project: "مشروع", general: "عام" } as any)[group.group_type] || group.group_type
              }</p>
            )}
          </div>
          
          {/* ⋮ Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(`/group/${id}/settings`)}>
                <Settings className="w-4 h-4 me-2" /> الإعدادات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenInvite(true)}>
                <UserPlus className="w-4 h-4 me-2" /> دعوة عضو
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setReportOpen(true)}>
                <FileText className="w-4 h-4 me-2" /> التقرير
              </DropdownMenuItem>
              {isAdmin && !isGroupClosed && (
                <DropdownMenuItem onClick={() => setPreviousBalanceOpen(true)}>
                  <Scale className="w-4 h-4 me-2" /> إضافة رصيد سابق
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {isAdmin && groupState === 'active' && (
                <DropdownMenuItem onClick={() => setFinishGroupDialogOpen(true)}>
                  <Flag className="w-4 h-4 me-2 text-amber-600" /> إنهاء الرحلة
                </DropdownMenuItem>
              )}
              {isAdmin && (groupState === 'finished' || groupState === 'balanced') && (
                <DropdownMenuItem onClick={handleReopenGroup} disabled={reopeningGroup}>
                  <RotateCcw className="w-4 h-4 me-2" /> إعادة فتح الرحلة
                </DropdownMenuItem>
              )}
              {isAdmin && groupState === 'balanced' && (
                <DropdownMenuItem onClick={() => setCloseGroupDialogOpen(true)}>
                  <Shield className="w-4 h-4 me-2" /> إغلاق نهائي
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {!isOwner && (
                <DropdownMenuItem onClick={() => setLeaveGroupDialogOpen(true)} className="text-destructive">
                  <LogOut className="w-4 h-4 me-2" /> مغادرة المجموعة
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={() => setDeleteGroupDialogOpen(true)} className="text-destructive">
                  <Trash2 className="w-4 h-4 me-2" /> حذف المجموعة
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ═══════════ 2️⃣ SUMMARY GRID ═══════════ */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-card border border-border/50">
              <Users className="w-4 h-4 text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground leading-none">{memberCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">أعضاء</p>
            </div>
            <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-card border border-border/50">
              <Receipt className="w-4 h-4 text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground leading-none">{totals.approvedExpenses.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">المصاريف ({currencyLabel})</p>
            </div>
            <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-card border border-border/50">
              <Wallet className="w-4 h-4 text-muted-foreground mb-1" />
              <p className={cn(
                "text-xl font-black leading-none",
                myBalances.confirmed >= 0 ? "text-green-600" : "text-destructive"
              )}>
                {myBalances.confirmed >= 0 ? '+' : ''}{myBalances.confirmed.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">رصيدك ({currencyLabel})</p>
            </div>
          </div>

          {/* Status line */}
          <div className="text-center">
            {myBalances.confirmed > 0.01 ? (
              <span className="text-sm font-semibold text-green-600">لك {myBalances.confirmed.toLocaleString()} {currencyLabel}</span>
            ) : myBalances.confirmed < -0.01 ? (
              <span className="text-sm font-semibold text-destructive">عليك {Math.abs(myBalances.confirmed).toLocaleString()} {currencyLabel}</span>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">متوازن ✓</span>
            )}
          </div>

          {/* Budget bar (from plan) */}
          {sourcePlan?.budgetValue && (() => {
            const budgetUsed = Math.min((totals.approvedExpenses / sourcePlan.budgetValue) * 100, 100);
            const isOverBudget = totals.approvedExpenses > sourcePlan.budgetValue;
            const budgetRemaining = sourcePlan.budgetValue - totals.approvedExpenses;
            return (
              <div className="px-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>الميزانية</span>
                  <span className={cn("font-bold", isOverBudget ? "text-destructive" : "text-foreground")}>
                    {totals.approvedExpenses.toLocaleString()} / {sourcePlan.budgetValue.toLocaleString()} {sourcePlan.budgetCurrency}
                  </span>
                </div>
                <Progress value={budgetUsed} className={cn("h-1.5", isOverBudget && "[&>div]:bg-destructive")} />
                {isOverBudget && (
                  <p className="text-[10px] text-destructive font-semibold text-end">تجاوز الميزانية!</p>
                )}
              </div>
            );
          })()}
        </div>

        {/* ═══════════ 3️⃣ SMART ACTION BAR ═══════════ */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            {myBalances.confirmed < -0.01 ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowDownCircle className="w-5 h-5 text-destructive shrink-0" />
                  <span className="text-sm font-semibold text-destructive truncate">
                    عليك {Math.abs(myBalances.confirmed).toLocaleString()} {currencyLabel}
                  </span>
                </div>
                <Button variant="default" size="sm" onClick={() => openSettlement()} className="shrink-0">
                  سدد الآن
                </Button>
              </div>
            ) : myBalances.confirmed > 0.01 ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowUpCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-sm font-semibold text-green-600 truncate">
                    لك {myBalances.confirmed.toLocaleString()} {currencyLabel}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRequestPaymentOpen(true)} className="shrink-0">
                  اطلب السداد
                </Button>
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">ابدأ بإضافة أول مصروف</span>
                <Button variant="default" size="sm" onClick={() => navigate(`/add-expense?groupId=${id}`)} className="shrink-0">
                  <Plus className="w-4 h-4 me-1" /> إضافة مصروف
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-muted-foreground">كل شيء تمام ✓</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/add-expense?groupId=${id}`)} className="shrink-0">
                  <Plus className="w-4 h-4 me-1" /> أضف مصروف
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════════ 4️⃣ SMART SUGGESTION (optional) ═══════════ */}
        {smartSuggestion && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
            <Lightbulb className="w-4 h-4 text-accent shrink-0" />
            <p className="text-xs text-muted-foreground">{smartSuggestion}</p>
          </div>
        )}

        {/* ═══════════ SMART GROUP SUGGESTIONS ═══════════ */}
        {sourcePlan && id && (
          <SmartGroupSuggestions
            groupId={id}
            city={sourcePlan.destination || undefined}
            destination={sourcePlan.destination || undefined}
          />
        )}

        {/* ═══════════ PLAN SECTION (if from plan) ═══════════ */}
        {sourcePlan && sourcePlan.days.length > 0 && id && (
          <GroupPlanSection
            planId={sourcePlan.planId}
            planName={sourcePlan.planName}
            budgetValue={sourcePlan.budgetValue}
            budgetCurrency={sourcePlan.budgetCurrency}
            totalExpenses={totals.approvedExpenses}
            days={sourcePlan.days}
            groupId={id}
          />
        )}

        {/* ═══════════ 5️⃣ SECONDARY ACTIONS ═══════════ */}
        {canAddExpenses && (
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" size="sm" className="text-xs h-9"
              onClick={() => navigate(`/add-expense?groupId=${id}`)}
            >
              <Plus className="w-3.5 h-3.5 me-1" /> مصروف
            </Button>
            <Button 
              variant="outline" size="sm" className="text-xs h-9"
              onClick={() => openSettlement()}
            >
              <DollarSign className="w-3.5 h-3.5 me-1" /> تسوية
            </Button>
            <Button 
              variant="outline" size="sm" className="text-xs h-9"
              onClick={() => setOpenInvite(true)}
            >
              <UserPlus className="w-3.5 h-3.5 me-1" /> دعوة
            </Button>
          </div>
        )}

        {/* Pending ratings for closed groups */}
        {isGroupClosed && registeredMembers.length > 0 && (
          <PendingRatingsNotification
            groupId={id!}
            members={registeredMembers.map(m => ({
              user_id: m.user_id,
              display_name: profiles[m.user_id]?.display_name,
              name: profiles[m.user_id]?.name,
            }))}
            onStartRating={() => {
              const firstMember = registeredMembers.find(m => m.user_id !== currentUserId);
              if (firstMember) {
                setMemberToRate({
                  user_id: firstMember.user_id,
                  display_name: profiles[firstMember.user_id]?.display_name || null,
                  name: profiles[firstMember.user_id]?.name || null,
                  avatar_url: profiles[firstMember.user_id]?.avatar_url || null,
                });
                setRatingSheetOpen(true);
              }
            }}
          />
        )}

        {/* ═══════════ 6️⃣ CHAT TIMELINE ═══════════ */}
        {id && (
          <GroupChat 
            groupId={id} 
            expanded={true}
            isGroupActive={canAddExpenses}
            onAddExpense={() => navigate(`/add-expense?groupId=${id}`)}
            settlements={settlements}
            profiles={profiles}
            currency={currencyLabel}
            currentUserId={currentUserId}
            onSettlementConfirmed={refetch}
          />
        )}

        {/* ═══════════ 7️⃣ EXPENSES PREVIEW ═══════════ */}
        {!isGroupClosed && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold">المصاريف</h2>
            {expenses.length > 3 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" 
                onClick={() => navigate(`/my-expenses?group=${id}`)}>
                عرض الكل ({expenses.length}) <ChevronLeft className="w-3 h-3 ms-1" />
              </Button>
            )}
          </div>

          {loading && <p className="text-sm text-muted-foreground px-1">جاري التحميل...</p>}
          
          {!loading && expenses.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-card border border-border/50">
              <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد مصاريف بعد</p>
              {canAddExpenses && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => navigate(`/add-expense?groupId=${id}`)}>
                  <Plus className="w-3.5 h-3.5 me-1" /> إضافة مصروف
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {previewExpenses.map((expense) => {
                const payerName = (expense.payer_id && (profiles[expense.payer_id]?.display_name || profiles[expense.payer_id]?.name)) || "عضو";
                return (
                  <Card key={expense.id} className="bg-card/90 border border-border/50 shadow-card rounded-xl cursor-pointer"
                    onClick={() => setSelectedExpenseForDetails(expense)}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                          <Receipt className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-1">{expense.description ?? "مصروف"}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">دفع بواسطة {payerName}</p>
                        </div>
                        <div className="text-left shrink-0 flex flex-col items-end gap-1">
                          <p className="text-xl font-black text-accent leading-none">
                            {Number(expense.amount).toLocaleString()}
                            <span className="text-[10px] font-medium text-muted-foreground ms-0.5">{expense.currency || "SAR"}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(expense.spent_at ?? expense.created_at ?? "").toString().slice(0, 10)}
                          </p>
                          {expense.status === "approved" && (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] px-1.5 py-0" variant="outline">
                              <CheckCircle className="w-2.5 h-2.5 me-0.5" />معتمد
                            </Badge>
                          )}
                          {expense.status === "pending" && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] px-1.5 py-0" variant="outline">
                              <Clock className="w-2.5 h-2.5 me-0.5" />معلّق
                            </Badge>
                          )}
                          {expense.status === "rejected" && (
                            <Badge className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0" variant="outline">
                              <XCircle className="w-2.5 h-2.5 me-0.5" />مرفوض
                            </Badge>
                          )}
                          {expense.status === "pending" && canApprove && (
                            <div className="flex gap-1 mt-1">
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "approve"); }}
                                className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-green-600" aria-label="اعتماد">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "reject"); }}
                                className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-destructive" aria-label="رفض">
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════ 8️⃣ SETTLEMENT CARD ═══════════ */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">التسويات</h2>
              {settlements.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{settlements.length}</Badge>
              )}
            </div>
            {myBalances.confirmed < -0.01 ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-destructive font-semibold">عليك {Math.abs(myBalances.confirmed).toLocaleString()} {currencyLabel}</span>
                <Button variant="default" size="sm" onClick={() => openSettlement()}>سدد الآن</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">المجموعة متوازنة ✓</span>
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setSettlementDetailsOpen(true)}>
              عرض التفاصيل <ChevronLeft className="w-3 h-3 ms-1" />
            </Button>
          </CardContent>
        </Card>

        {/* ═══════════ 9️⃣ MEMBERS PREVIEW ═══════════ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold">الأعضاء</h2>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => setMembersSheetOpen(true)}>
              عرض الكل ({memberCount}) <ChevronLeft className="w-3 h-3 ms-1" />
            </Button>
          </div>

          {registeredMembers.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-card border border-border/50">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">ادعُ أعضاء للمجموعة</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setOpenInvite(true)}>
                <UserPlus className="w-3.5 h-3.5 me-1" /> دعوة عضو
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {previewMembers.map((member) => {
                const profile = profiles[member.user_id];
                const balance = balances.find(b => b.user_id === member.user_id);
                const net = Number(balance?.net_balance ?? 0);
                return (
                  <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium truncate">{profile?.display_name || profile?.name || 'عضو'}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      net > 0.01 ? "text-green-600" : net < -0.01 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {net > 0.01 ? '+' : ''}{net.toLocaleString()} {currencyLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* ═══════════ MEMBERS SHEET ═══════════ */}
      <Sheet open={membersSheetOpen} onOpenChange={setMembersSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>جميع الأعضاء ({memberCount})</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            {!isGroupClosed && (
              <Button variant="outline" className="w-full" onClick={() => { setMembersSheetOpen(false); setOpenInvite(true); }}>
                <UserPlus className="w-4 h-4 me-2" /> دعوة عضو جديد
              </Button>
            )}

            <PendingInvitesSection groupId={id} isAdmin={isAdmin || isOwner} />

            {registeredMembers.map((member) => {
              const memberSubscription = memberSubscriptions[member.user_id];
              const memberPlan = memberSubscription?.plan || 'free';
              const memberPlanConfig = getPlanBadgeConfig(memberPlan as any);
              const memberProfile = profiles[member.user_id];
              const memberBalance = balances.find(b => b.user_id === member.user_id);
              const memberPending = pendingAmounts.find(p => p.user_id === member.user_id);
              
              return (
                <MemberCard key={member.user_id}
                  member={{ ...member, profile: memberProfile }}
                  currentUserId={currentUserId} isOwner={isOwner} canAdmin={canApprove} groupId={id!}
                  onMemberRemoved={forceRefresh} planConfig={memberPlanConfig}
                  balance={memberBalance} pendingAmount={memberPending} currency={currencyLabel}
                  allBalances={balances} profiles={profiles}
                />
              );
            })}

            {(() => {
              const pendingMembers = members.filter(m => !m.user_id || m.status === 'pending' || m.status === 'invited');
              if (pendingMembers.length === 0) return null;
              return (
                <div className="space-y-3 mt-4">
                  <h3 className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    أعضاء بانتظار التسجيل ({pendingMembers.length})
                  </h3>
                  {pendingMembers.map((member) => (
                    <PendingMemberCard key={member.id} member={member} isAdmin={isAdmin || isOwner} groupId={id!} groupName={group?.name} onRemoved={forceRefresh} />
                  ))}
                </div>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════ SETTLEMENT DETAILS SHEET ═══════════ */}
      <Sheet open={settlementDetailsOpen} onOpenChange={setSettlementDetailsOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>تفاصيل التسويات</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {!loading && !error && currentUserId && (
              <BalanceDashboard
                currentUserId={currentUserId} balances={balances} pendingAmounts={pendingAmounts}
                settlements={settlements} profiles={profiles} currency={currencyLabel}
                groupName={group?.name || ""} groupId={id}
                hasUnconfirmedMembers={members.some(m => (m as any).status === 'invited' || (m as any).status === 'pending')}
                isOwner={isOwner} isGroupClosed={isGroupClosed}
                onCloseGroup={() => setCloseGroupDialogOpen(true)}
                onRemindDebtor={async (debtorUserId, amount) => {
                  if (!id || !group?.name) return;
                  await notifySettlementReminder(id, group.name, debtorUserId, amount, currencyLabel);
                  toast({ title: t('groups:settlement_share.reminder_sent', 'تم إرسال التذكير بنجاح! 🔔') });
                }}
                onSettleClick={(toUserId, amount) => openSettlement(toUserId, amount)}
                onSettlementConfirmed={refetch}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════ All Dialogs ═══════════ */}
      <GroupSettlementDialog
        open={settleOpen} onOpenChange={setSettleOpen} groupId={id} currentUserId={currentUserId}
        members={registeredMembers} profiles={profiles} balances={balances} pendingAmounts={pendingAmounts}
        initialToUserId={prefillTo} initialAmount={prefillAmount} onCreated={() => refetch()} groupCurrency={groupCurrency}
      />
      <SettlementGuardDialog open={settlementGuardOpen} onOpenChange={setSettlementGuardOpen}
        onProceedActiveOnly={() => { setSettlementGuardOpen(false); setSettleOpen(true); }}
      />
      <EditExpenseDialog open={editExpenseOpen} onOpenChange={setEditExpenseOpen} expense={selectedExpense} onUpdated={() => refetch()} />
      <RejectExpenseDialog open={rejectExpenseOpen} onOpenChange={setRejectExpenseOpen} expenseId={selectedExpense?.id}
        expenseDescription={selectedExpense?.description || ""} onRejected={() => refetch()}
      />
      <ExpenseDetailsDialog
        open={!!selectedExpenseForDetails} onOpenChange={(open) => { if (!open) setSelectedExpenseForDetails(null); }}
        expense={selectedExpenseForDetails} profiles={profiles} canApprove={canApprove}
        onApprove={handleExpenseApproval} isAdmin={isAdmin} onDeleted={() => refetch()}
      />
      <AlertDialog open={deleteExpenseConfirmOpen} onOpenChange={setDeleteExpenseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
              <br /><strong className="text-foreground">{expenseToDelete?.description}</strong> - {Number(expenseToDelete?.amount || 0).toLocaleString()} {expenseToDelete?.currency}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (expenseToDelete) {
                const success = await deleteExpense(expenseToDelete.id);
                if (success) { setDeleteExpenseConfirmOpen(false); setExpenseToDelete(null); refetch(); }
              }
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deletingExpense}>
              {deletingExpense ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DeleteGroupDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}
        groupName={group?.name || ""} onConfirm={handleDeleteGroup} isDeleting={isDeletingGroup}
      />
      <LeaveGroupDialog open={leaveGroupDialogOpen} onOpenChange={setLeaveGroupDialogOpen}
        groupName={group?.name || ""} onConfirm={handleLeaveGroup} isLeaving={isLeavingGroup}
      />
      <CloseGroupDialog open={closeGroupDialogOpen} onOpenChange={setCloseGroupDialogOpen}
        onConfirm={async () => { 
          const success = await closeGroup(); 
          if (success) { 
            setCloseGroupDialogOpen(false); 
            refetch(); 
            setTimeout(() => setTripSummaryOpen(true), 500);
          } 
        }}
        loading={closingGroup} groupName={group?.name}
      />
      <FinishGroupDialog open={finishGroupDialogOpen} onOpenChange={setFinishGroupDialogOpen}
        onConfirm={handleFinishGroup} loading={finishingGroup} groupName={group?.name}
      />
      <RequestPaymentDialog
        open={requestPaymentOpen}
        onOpenChange={setRequestPaymentOpen}
        debtors={debtors}
        currency={currencyLabel}
        groupName={group?.name || ""}
        currentUserId={currentUserId}
        currentUserName={profiles[currentUserId || '']?.display_name || profiles[currentUserId || '']?.name || ''}
      />
      <TripSummarySheet
        open={tripSummaryOpen}
        onOpenChange={setTripSummaryOpen}
        {...tripSummaryData}
      />
      {id && currentUserId && (
        <PreviousBalanceSheet
          open={previousBalanceOpen}
          onOpenChange={setPreviousBalanceOpen}
          groupId={id}
          currentUserId={currentUserId}
          members={registeredMembers.map(m => ({
            user_id: m.user_id,
            name: nameOf(m.user_id),
          }))}
          currency={currencyLabel}
          onCreated={refetch}
        />
      )}
      {memberToRate && (
        <RatingSheet open={ratingSheetOpen} onOpenChange={setRatingSheetOpen} groupId={id!} member={memberToRate}
          onRatingSubmitted={() => { setMemberToRate(null); refetch(); }}
        />
      )}
      </div>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
      
      <ProfileCompletionSheet open={showProfileCompletion} onOpenChange={setShowProfileCompletion} />
    </div>
  );
};

export default GroupDetails;
