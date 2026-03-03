import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  ArrowRight, Users, Receipt, MessageCircle, Target, Plus, Settings,
  DollarSign, MoreHorizontal, UserPlus, Edit, CheckCircle, Clock,
  XCircle, Shield, FileText, Trash2, AlertTriangle, LogOut, Flag, RotateCcw
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
import { useGroupBudgetTracking } from "@/hooks/useGroupBudgetTracking";
import { useBudgets } from "@/hooks/useBudgets";
import { CreateBudgetDialog } from "@/components/budgets/CreateBudgetDialog";
import { BudgetProgressCard } from "@/components/budgets/BudgetProgressCard";
import { BudgetQuickActions } from "@/components/budgets/BudgetQuickActions";
import { EditBudgetDialog } from "@/components/budgets/EditBudgetDialog";
import { DeleteBudgetDialog } from "@/components/budgets/DeleteBudgetDialog";
import { useCurrencies } from "@/hooks/useCurrencies";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { RecommendationNotification } from "@/components/recommendations/RecommendationNotification";
import { useRecommendationTriggers } from "@/hooks/useRecommendationTriggers";
import { useRecommendations } from "@/hooks/useRecommendations";
import { DeleteGroupDialog } from "@/components/group/DeleteGroupDialog";
import { LeaveGroupDialog } from "@/components/group/LeaveGroupDialog";
import { CloseGroupDialog } from "@/components/group/CloseGroupDialog";
import { PendingRatingsNotification } from "@/components/group/PendingRatingsNotification";
import { RatingSheet } from "@/components/group/RatingSheet";
import { useGroupNotifications } from "@/hooks/useGroupNotifications";
import { useGroupStatus } from "@/hooks/useGroupStatus";
import { useTranslation } from "react-i18next";
import { ProfileCompletionSheet } from "@/components/profile/ProfileCompletionSheet";

// New components
import { GroupStatusBanner, GroupStateBadge, type GroupState } from "@/components/group/GroupStatusBanner";
import { GroupCompactSummary } from "@/components/group/GroupCompactSummary";
import { SettlementProgressBar } from "@/components/group/SettlementProgressBar";
import { FinishGroupDialog } from "@/components/group/FinishGroupDialog";
import { RequestPaymentDialog } from "@/components/group/RequestPaymentDialog";
import { TripSummarySheet } from "@/components/group/TripSummarySheet";
import { PreviousBalanceSheet } from "@/components/group/PreviousBalanceSheet";
import { computeMemberBadges, MemberBadge } from "@/components/group/GroupMemberBadges";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const GroupDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: rawId } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenseFilter, setExpenseFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
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
  
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [deleteBudgetOpen, setDeleteBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deletingBudget, setDeletingBudget] = useState<any>(null);
  
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
  
  const { budgetTracking, budgetAlerts, isLoading: budgetLoading, getStatusColor, getStatusLabel, getAlertMessage } = useGroupBudgetTracking(id);
  const { budgets, createBudget, updateBudget, deleteBudget, isCreating } = useBudgets(id);
  const { formatCurrency, currencies } = useCurrencies();
  
  const { shouldShow: showRecommendation, triggerType, mealType, dismissTrigger, isEnabled: recommendationsEnabled } = useRecommendationTriggers({ groupId: id });
  const { addAsExpense, dismissRecommendation, currentRecommendation, generateRecommendation, isLoading: recommendationLoading } = useRecommendations();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (group?.name) {
      document.title = `${group.name} - تفاصيل المجموعة`;
    }
  }, [group?.name]);

  const budgetTotals = useMemo(() => {
    if (!budgetTracking || budgetTracking.length === 0) return { total: 0, spent: 0, percentage: 0 };
    const total = budgetTracking.reduce((sum, c) => sum + (c.budgeted_amount || 0), 0);
    const spent = budgetTracking.reduce((sum, c) => sum + (c.spent_amount || 0), 0);
    return { total, spent, percentage: total > 0 ? (spent / total) * 100 : 0 };
  }, [budgetTracking]);

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

  // Compute group state
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

  // Settlement progress
  const settlementProgress = useMemo(() => {
    const totalDebt = balanceSummary
      .filter(b => Number(b.total_net ?? 0) < 0)
      .reduce((sum, b) => sum + Math.abs(Number(b.total_net ?? 0)), 0);
    const totalSettled = settlements.reduce((sum, s) => sum + Number(s.amount ?? 0), 0);
    const debtorCount = balanceSummary.filter(b => Number(b.total_net ?? 0) < -0.01).length;
    const pendingCount = members.filter(m => (m as any).status === 'invited' || (m as any).status === 'pending').length;
    return { totalDebt, totalSettled, debtorCount, pendingCount };
  }, [balanceSummary, settlements, members]);

  const filteredExpenses = useMemo(() => {
    if (expenseFilter === "all") return expenses;
    return expenses.filter(e => e.status === expenseFilter);
  }, [expenses, expenseFilter]);

  // Debtors for payment request dialog
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

  // Member badges (Phase 3)
  const memberBadges = useMemo(() => {
    const msgCounts: Record<string, number> = {};
    // We can't easily get message counts here without extra query, so leave empty for now
    return computeMemberBadges(
      registeredMembers.map(m => m.user_id),
      balances,
      settlements,
      msgCounts,
    );
  }, [registeredMembers, balances, settlements]);

  // Trip summary data (Phase 3)
  const tripSummaryData = useMemo(() => {
    const topPayer = balances.reduce((best, b) => 
      b.amount_paid > (best?.amount_paid ?? 0) ? b : best, balances[0]);
    const diceCount = settlements.filter((s: any) => s.settlement_type === 'dice').length; // approximate
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

  const groupCurrency = group?.currency || 'SAR';
  const currency = currencies.find(c => c.code === groupCurrency);
  const currencyLabel = currency?.symbol || groupCurrency;
  const memberCount = members.length;
  const nameOf = (uid: string) => (uid ? (profiles[uid]?.display_name || profiles[uid]?.name || `${uid.slice(0,4)}...`) : 'عضو معلق');

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
      
      <UnifiedAdLayout placement="group_details" showTopBanner={false} showBottomBanner={false}>

      {/* Dialogs */}
      <InviteManagementDialog 
        open={openInvite} onOpenChange={setOpenInvite} groupId={id} groupName={group?.name}
        existingMembers={registeredMembers.map(m => m.user_id)}
      />
      <GroupReportDialog open={reportOpen} onOpenChange={setReportOpen} groupName={group?.name} groupId={id}
        profiles={profiles} expenses={expenses} balances={balances} totalExpenses={totals.totalExpenses}
      />

      <div className="page-container space-y-3">

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
              <DropdownMenuSeparator />
              
              {/* Finish / Reopen trip */}
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

        {/* ═══════════ 2️⃣ COMPACT SUMMARY ═══════════ */}
        <GroupCompactSummary
          myBalance={myBalances.confirmed}
          totalExpenses={totals.approvedExpenses}
          memberCount={memberCount}
          currencyLabel={currencyLabel}
        />

        {/* ═══════════ 3️⃣ SETTLEMENT PROGRESS ═══════════ */}
        {settlementProgress.totalDebt > 0 && (
          <SettlementProgressBar
            totalDebt={settlementProgress.totalDebt}
            totalSettled={settlementProgress.totalSettled}
            debtorCount={settlementProgress.debtorCount}
            pendingCount={settlementProgress.pendingCount}
          />
        )}

        {/* ═══════════ 4️⃣ DYNAMIC STATUS BANNER ═══════════ */}
        <GroupStatusBanner
          state={groupState}
          myBalance={myBalances.confirmed}
          currencyLabel={currencyLabel}
          onSettleNow={() => openSettlement()}
          onFinalClose={() => setCloseGroupDialogOpen(true)}
        />

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

        {/* ═══════════ 5️⃣ ADD EXPENSE BUTTON ═══════════ */}
        {canAddExpenses && (
          <Button 
            onClick={() => navigate(`/add-expense?groupId=${id}`)} 
            variant="hero" 
            className="w-full"
          >
            <Plus className="w-4 h-4 me-2" />
            إضافة مصروف
          </Button>
        )}

        {/* Recommendation */}
        {recommendationsEnabled && showRecommendation && (
          <RecommendationNotification
            type={triggerType === 'meal_time' ? mealType || 'lunch' : triggerType}
            placeName={currentRecommendation?.name}
            onViewRecommendation={() => {
              if (!currentRecommendation && id) {
                generateRecommendation({ trigger: (triggerType === 'meal_time' ? 'meal_time' : triggerType) || 'planning', groupId: id });
              }
              if (currentRecommendation) {
                navigate(`/add-expense?groupId=${id}&fromRecommendation=true&recommendationId=${currentRecommendation.id}`);
              }
            }}
            onDismiss={() => { dismissTrigger(); if (currentRecommendation) dismissRecommendation(currentRecommendation.id); }}
            autoHideAfter={30000}
          />
        )}

        {/* ═══════════ 💬 CHAT — القلب الأساسي ═══════════ */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold">الدردشة</h2>
            {onlineCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {onlineCount} متصل
              </Badge>
            )}
          </div>
          {id && (
            <GroupChat 
              groupId={id} 
              expanded={true}
              isGroupActive={canAddExpenses}
              onAddExpense={() => navigate(`/add-expense?groupId=${id}`)}
            />
          )}
        </div>

        {/* ═══════════ TABS — محتوى ثانوي ═══════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted/60">
            <TabsTrigger value="expenses" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">المصاريف</TabsTrigger>
            <TabsTrigger value="members" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">الأعضاء</TabsTrigger>
            <TabsTrigger value="settlements" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">التسويات</TabsTrigger>
            <TabsTrigger value="budget" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">الميزانية</TabsTrigger>
          </TabsList>

          {/* ── Expenses Tab ── */}
          <TabsContent value="expenses" className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold">المصاريف</h2>
              {canAddExpenses && (
                <Button onClick={() => navigate(`/add-expense?groupId=${id}`)} variant="hero" size="sm" className="text-xs">
                  <Plus className="w-3.5 h-3.5 me-1" />
                  إضافة مصروف
                </Button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {([
                { key: "all" as const, label: "الكل" },
                { key: "approved" as const, label: "معتمد" },
                { key: "pending" as const, label: "معلّق" },
                { key: "rejected" as const, label: "مرفوض" },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setExpenseFilter(f.key)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
                    expenseFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}
            
            <div className="space-y-2.5">
              {filteredExpenses.map((expense) => {
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
                          {expense.status === "rejected" && expense.expense_rejections && expense.expense_rejections.length > 0 && (
                            <div className="mt-1.5 p-2 bg-destructive/5 border border-destructive/10 rounded-lg">
                              <p className="text-[10px] text-destructive/80 leading-relaxed line-clamp-2">
                                {expense.expense_rejections[0].rejection_reason || "لم يتم تحديد سبب"}
                              </p>
                            </div>
                          )}
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
                              {isAdmin && (
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpenseToDelete(expense); setDeleteExpenseConfirmOpen(true); }}
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100 text-destructive" aria-label="حذف">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          {isAdmin && expense.status !== "pending" && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpenseToDelete(expense); setDeleteExpenseConfirmOpen(true); }}
                              className="h-6 w-6 p-0 opacity-50 hover:opacity-100 text-destructive mt-1" aria-label="حذف">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                          {expense.status === "rejected" && currentUserId === expense.payer_id && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditExpense(expense); }}
                              className="text-[10px] h-6 px-2 opacity-70 hover:opacity-100 mt-1">
                              <Edit className="w-3 h-3 me-0.5" />تعديل
                            </Button>
                          )}
                          {(expense.status === "pending" || expense.status === "rejected") && currentUserId === expense.payer_id && !canApprove && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditExpense(expense); }}
                              className="text-[10px] h-6 px-2 opacity-70 hover:opacity-100 mt-1">
                              <Edit className="w-3 h-3 me-0.5" />تعديل
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {!loading && expenses.length === 0 && (
                <p className="text-sm text-muted-foreground">لا توجد مصاريف بعد.</p>
              )}
            </div>
          </TabsContent>

          {/* ── Members Tab ── */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">الأعضاء</h2>
              {!isGroupClosed && (
                <Button variant="outline" onClick={() => setOpenInvite(true)}>
                  <UserPlus className="w-4 h-4 ml-2" />
                  دعوة عضو جديد
                </Button>
              )}
            </div>

            <PendingInvitesSection groupId={id} isAdmin={isAdmin || isOwner} />
            
            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}

            <div className="space-y-4">
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
              {!loading && registeredMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">لا يوجد أعضاء حتى الآن.</p>
              )}
            </div>

            {(() => {
              const pendingMembers = members.filter(m => !m.user_id || m.status === 'pending' || m.status === 'invited');
              if (pendingMembers.length === 0) return null;
              return (
                <div className="space-y-3 mt-6">
                  <h3 className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    أعضاء بانتظار التسجيل ({pendingMembers.length})
                  </h3>
                  {pendingMembers.map((member) => (
                    <PendingMemberCard key={member.id} member={member} isAdmin={isAdmin || isOwner} groupId={id!} onRemoved={forceRefresh} />
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {/* ── Settlements Tab ── */}
          <TabsContent value="settlements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">التسويات</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openSettlement()}>إضافة تسوية</Button>
                {myBalances.confirmed < 0 && (
                  <Button variant="hero" onClick={() => openSettlement()}>تسوية الآن</Button>
                )}
              </div>
            </div>

            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}

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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">جميع التسويات</h3>
              {settlements.map(s => (
                <Card key={s.id} className="bg-card/90 border border-border/50 shadow-card rounded-2xl">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold">{nameOf(s.from_user_id)} → {nameOf(s.to_user_id)}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{(s.created_at || '').toString().slice(0,10)}</span>
                            {s.note && <span className="opacity-40">•</span>}
                            {s.note && <span className="truncate">{s.note}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="text-2xl font-black text-accent">{Number(s.amount).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{currencyLabel}</div>
                        {(currentUserId === s.created_by || canApprove) && (
                          <div className="flex justify-end mt-2">
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleDeleteSettlement(s.id)}>
                              <Trash2 className="w-4 h-4 ml-1" /> حذف
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!loading && settlements.length === 0 && (
                <p className="text-sm text-muted-foreground">لا توجد تسويات بعد.</p>
              )}
            </div>
          </TabsContent>

          {/* ── Budget Tab ── */}
          <TabsContent value="budget">
            <div className="space-y-6">
              <BudgetQuickActions
                groupId={id!} groupName={group?.name} groupType={group?.group_type} memberCount={memberCount}
                budgetCount={budgets.length} totalBudget={budgetTotals.total} totalSpent={budgetTotals.spent}
                onCreateBudget={async (budgetData) => {
                  await createBudget({
                    name: budgetData.name, total_amount: budgetData.total_amount,
                    amount_limit: budgetData.amount_limit || budgetData.total_amount,
                    group_id: budgetData.group_id, period: budgetData.period || "monthly",
                    start_date: budgetData.start_date || new Date().toISOString().split('T')[0],
                    end_date: budgetData.end_date, budget_type: budgetData.budget_type || "monthly",
                    category_id: budgetData.category_id
                  });
                }}
                isCreating={isCreating}
              />

              {budgetLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                  <p className="text-muted-foreground mt-2">جاري تحميل الميزانيات...</p>
                </div>
              ) : budgetTracking && budgetTracking.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">فئات الميزانية</h3>
                    <Badge variant="secondary">{budgetTracking.length} فئة</Badge>
                  </div>
                  <div className="grid gap-4">
                    {budgetTracking.map((categoryBudget) => {
                      const budgetForCard = {
                        id: categoryBudget.category_id || '', name: categoryBudget.category_name || 'فئة غير محددة',
                        total_amount: categoryBudget.budgeted_amount, period: 'monthly' as const,
                        start_date: new Date().toISOString().split('T')[0], end_date: null,
                        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                        created_by: '', group_id: id!, category_id: categoryBudget.category_id,
                        budget_type: 'monthly' as const, amount_limit: categoryBudget.budgeted_amount, starts_on: null
                      };
                      return (
                        <BudgetProgressCard key={`category-${categoryBudget.category_id}`}
                          budget={budgetForCard} progress={categoryBudget.spent_percentage}
                          spent={categoryBudget.spent_amount} remaining={categoryBudget.remaining_amount}
                          onEdit={() => { setEditingBudget(budgetForCard); setEditBudgetOpen(true); }}
                          onDelete={() => { setDeletingBudget(budgetForCard); setDeleteBudgetOpen(true); }}
                          formatCurrency={(amount) => formatCurrency(amount, group?.currency || 'SAR')}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">لا توجد ميزانيات بعد</div>
                  <p className="text-sm text-muted-foreground mt-2">ابدأ بإنشاء ميزانية لتتبع مصاريف المجموعة</p>
                </div>
              )}

              {budgetAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-600">تنبيهات الميزانية</h4>
                  {budgetAlerts.map((alert, index) => (
                    <Card key={index} className="border-amber-200 bg-amber-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <p className="text-sm font-medium text-amber-800">{getAlertMessage(alert)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
      <CreateBudgetDialog open={createBudgetOpen} onOpenChange={setCreateBudgetOpen}
        onCreateBudget={async (data) => { await createBudget({ ...data, group_id: id! }); setCreateBudgetOpen(false); refetch(); }}
        isCreating={isCreating}
      />
      <EditBudgetDialog open={editBudgetOpen} onOpenChange={setEditBudgetOpen} budget={editingBudget}
        onUpdate={async (budgetId, updates) => { await updateBudget({ id: budgetId, ...updates }); setEditBudgetOpen(false); setEditingBudget(null); }}
        isUpdating={isCreating}
      />
      <DeleteBudgetDialog open={deleteBudgetOpen} onOpenChange={setDeleteBudgetOpen} budget={deletingBudget}
        onConfirm={async () => { if (deletingBudget) { await deleteBudget(deletingBudget.id); setDeleteBudgetOpen(false); setDeletingBudget(null); } }}
        isDeleting={isCreating}
      />
      <DeleteGroupDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}
        groupName={group?.name || ""} onConfirm={handleDeleteGroup} isDeleting={isDeletingGroup}
      />
      <LeaveGroupDialog open={leaveGroupDialogOpen} onOpenChange={setLeaveGroupDialogOpen}
        groupName={group?.name || ""} onConfirm={handleLeaveGroup} isLeaving={isLeavingGroup}
      />
      <CloseGroupDialog open={closeGroupDialogOpen} onOpenChange={setCloseGroupDialogOpen}
        onConfirm={async () => { const success = await closeGroup(); if (success) { setCloseGroupDialogOpen(false); refetch(); } }}
        loading={closingGroup} groupName={group?.name}
      />
      <FinishGroupDialog open={finishGroupDialogOpen} onOpenChange={setFinishGroupDialogOpen}
        onConfirm={handleFinishGroup} loading={finishingGroup} groupName={group?.name}
      />
      {memberToRate && (
        <RatingSheet open={ratingSheetOpen} onOpenChange={setRatingSheetOpen} groupId={id!} member={memberToRate}
          onRatingSubmitted={() => { setMemberToRate(null); refetch(); }}
        />
      )}
      </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
      
      <ProfileCompletionSheet open={showProfileCompletion} onOpenChange={setShowProfileCompletion} />
    </div>
  );
};

export default GroupDetails;
