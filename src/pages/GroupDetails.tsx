import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  ArrowRight,
  Users, 
  Receipt, 
  MessageCircle,
  Target,
  Plus,
  Settings,
  DollarSign,
  Send,
  MoreHorizontal,
  UserPlus,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  FileText,
  Trash2,
  AlertTriangle,
  LogOut
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
// GroupSettingsDialog moved to dedicated page - /group/:id/settings
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
import { GroupCard } from "@/components/group/GroupCard";
import { LeaveGroupDialog } from "@/components/group/LeaveGroupDialog";
import { CloseGroupDialog } from "@/components/group/CloseGroupDialog";
import { PendingRatingsNotification } from "@/components/group/PendingRatingsNotification";
import { RatingSheet } from "@/components/group/RatingSheet";
import { useGroupNotifications } from "@/hooks/useGroupNotifications";
import { useGroupStatus } from "@/hooks/useGroupStatus";
import { useTranslation } from "react-i18next";
import { GroupDiceCard } from "@/components/group/GroupDiceCard";
import { Lock } from "lucide-react";
import { ProfileCompletionSheet } from "@/components/profile/ProfileCompletionSheet";
import { GroupActivityFeed } from "@/components/group/GroupActivityFeed";


const GroupDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: rawId } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenseFilter, setExpenseFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [openInvite, setOpenInvite] = useState(false);
  
  // Auto-open invite dialog or profile completion if coming from group creation/join
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
  // حوار التسوية
  const [settleOpen, setSettleOpen] = useState(false);
  const [settlementGuardOpen, setSettlementGuardOpen] = useState(false);
  const [prefillTo, setPrefillTo] = useState<string | undefined>(undefined);
  const [prefillAmount, setPrefillAmount] = useState<number | undefined>(undefined);
  
  // Helper: open settlement with guard check
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
  
  // حوارات تحرير ورفض المصاريف
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [rejectExpenseOpen, setRejectExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<any>(null);
  const [deleteExpenseConfirmOpen, setDeleteExpenseConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  
  // Budget state
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [deleteBudgetOpen, setDeleteBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deletingBudget, setDeletingBudget] = useState<any>(null);
  
  // Delete/Leave group state
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [leaveGroupDialogOpen, setLeaveGroupDialogOpen] = useState(false);
  const [closeGroupDialogOpen, setCloseGroupDialogOpen] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  
  // Rating state
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false);
  const [memberToRate, setMemberToRate] = useState<any>(null);
  
  const { t } = useTranslation(['groups', 'common']);
  const { notifyMemberLeft, notifyGroupDeleted } = useGroupNotifications();

  // تحقق من صحة معرف المجموعة وتوجيه في حال كان غير صالح
  const isValidUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  const id = rawId && rawId !== ":id" && isValidUUID(rawId) ? rawId : undefined;

  const { closeGroup, closing: closingGroup } = useGroupStatus(id);

  useEffect(() => {
    if (rawId && (rawId === ":id" || !isValidUUID(rawId))) {
      toast({ title: "معرّف المجموعة غير صالح", description: "تمت إعادتك للوحة التحكم.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [rawId, navigate, toast]);

  const { loading, error, group, members, profiles, expenses, balances, pendingAmounts, balanceSummary, settlements, totals, refetch, forceRefresh } = useGroupData(id);
  const isGroupClosed = group?.status === 'closed';
  const { isUserOnline, onlineCount } = useOnlinePresence(id);
  const { getPlanBadgeConfig } = usePlanBadge();
  const registeredMembers = useMemo(() => members.filter((m): m is typeof m & { user_id: string } => !!m.user_id), [members]);
  const { subscriptions: memberSubscriptions } = useMemberSubscriptions(registeredMembers.map(m => m.user_id));
  
  // Budget hooks
  const { budgetTracking, budgetAlerts, isLoading: budgetLoading, getStatusColor, getStatusLabel, getAlertMessage } = useGroupBudgetTracking(id);
  const { budgets, createBudget, updateBudget, deleteBudget, isCreating } = useBudgets(id);
  
  // Currency hook
  const { formatCurrency, currencies } = useCurrencies();
  
  // Recommendation hooks
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

  // Calculate budget totals from budget categories, not main budgets
  const budgetTotals = useMemo(() => {
    if (!budgetTracking || budgetTracking.length === 0) {
      return { total: 0, spent: 0, percentage: 0 };
    }
    
    const total = budgetTracking.reduce((sum, category) => sum + (category.budgeted_amount || 0), 0);
    const spent = budgetTracking.reduce((sum, category) => sum + (category.spent_amount || 0), 0);
    
    return {
      total,
      spent,
      percentage: total > 0 ? (spent / total) * 100 : 0
    };
  }, [budgetTracking]);

  // إخفاء شريط التمرير أثناء التواجد في صفحة تفاصيل المجموعة
  useEffect(() => {
    document.body.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
    };
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
  
  // Expense delete action
  const { deleteExpense, deleting: deletingExpense } = useExpenseActions();

  const isOwner = currentUserId != null && group?.owner_id === currentUserId;

  // الرصيد المعتمد والمحتمل
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

  const sendMessage = () => {
    toast({
      title: "اكتب رسالتك في صندوق الدردشة أسفل التبويب",
    });
  };

  const handleDeleteGroup = async () => {
    if (!id || !isOwner || !currentUserId) return;
    setIsDeletingGroup(true);
    
    await notifyGroupDeleted(id, group?.name || "", currentUserId);
    
    const { error: deleteError } = await supabase.from("groups").delete().eq("id", id);
    setIsDeletingGroup(false);
    
    if (deleteError) {
      toast({ title: t('groups:delete.failed'), variant: "destructive" });
      return;
    }
    
    toast({ title: t('groups:delete.success') });
    setDeleteGroupDialogOpen(false);
    navigate('/dashboard');
  };

  const handleLeaveGroup = async () => {
    if (!id || !currentUserId || isOwner) return;
    setIsLeavingGroup(true);
    
    await notifyMemberLeft(id, group?.name || "", currentUserId);
    
    const { error: leaveError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_id", currentUserId);
    setIsLeavingGroup(false);
    
    if (leaveError) {
      toast({ title: t('groups:settings.leave_failed'), variant: "destructive" });
      return;
    }
    
    toast({ title: t('groups:settings.left') });
    setLeaveGroupDialogOpen(false);
    navigate('/dashboard');
  };

  const handleExpenseApproval = async (expenseId: string, action: "approve" | "reject") => {
    if (action === "approve") {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        toast({ title: "تسجيل الدخول مطلوب", description: "يرجى تسجيل الدخول لاعتماد المصروف.", variant: "destructive" });
        return;
      }
      const resp = await fetch("https://iwthriddasxzbjddpzzf.functions.supabase.co/approve-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ expense_id: expenseId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("[approve-expense] error:", err);
        toast({ title: "تعذر اعتماد المصروف", description: err.error ?? "حدث خطأ غير متوقع", variant: "destructive" });
      } else {
        toast({ title: "تم اعتماد المصروف!", description: "تم تحديث الحالة إلى معتمد." });
        refetch();
      }
      return;
    }

    // For rejection, open the reject dialog
    if (action === "reject") {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        setSelectedExpense(expense);
        setRejectExpenseOpen(true);
      }
    }
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setEditExpenseOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            معتمد
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const nameOf = (uid: string) => (uid ? (profiles[uid]?.display_name || profiles[uid]?.name || `${uid.slice(0,4)}...`) : 'عضو معلق');

  // Note: Real-time listener is handled by useGroupData hook to avoid duplicate channels

  const handleDeleteSettlement = async (settlementId: string) => {
    const { error: delErr } = await supabase.from('settlements').delete().eq('id', settlementId);
    if (delErr) {
      toast({ title: 'تعذر حذف التسوية', description: delErr.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم حذف التسوية' });
    refetch();
  };
  
  const openReport = () => {
    console.log('[GroupDetails] open report click');
    setReportOpen(true);
  };

  const memberCount = members.length;
  const budgetProgress = 0;
  
  // استخدام عملة المجموعة الفعلية
  const groupCurrency = group?.currency || 'SAR';
  const currency = currencies.find(c => c.code === groupCurrency);
  const currencyLabel = currency?.symbol || groupCurrency;

  const membersLabel = (n: number) => (n === 1 ? "عضو" : n === 2 ? "عضوان" : "أعضاء");

  const getGroupTypeLabel = (groupType: string) => {
    const labels: Record<string, string> = {
      "trip": "رحلة",
      "home": "سكن مشترك", 
      "work": "عمل",
      "party": "حفلة",
      "project": "مشروع",
      "general": "عام"
    };
    return labels[groupType] || groupType;
  };

  return (
    <div className="min-h-screen bg-dark-background overflow-x-hidden">
      <SEO title={group?.name || "تفاصيل المجموعة"} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="group_details"
        showTopBanner={false}
        showBottomBanner={false}
      >

      <InviteManagementDialog 
        open={openInvite} 
        onOpenChange={setOpenInvite} 
        groupId={id} 
        groupName={group?.name}
        existingMembers={registeredMembers.map(m => m.user_id)}
      />
      {/* GroupSettingsDialog moved to /group/:id/settings page */}

      <GroupReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        groupName={group?.name}
        groupId={id}
        profiles={profiles}
        expenses={expenses}
        balances={balances}
        totalExpenses={totals.totalExpenses}
      />

      <div className="page-container space-y-6">
        {/* Recommendation Notification */}
        {recommendationsEnabled && showRecommendation && (
          <RecommendationNotification
            type={triggerType === 'meal_time' ? mealType || 'lunch' : triggerType}
            placeName={currentRecommendation?.name}
            onViewRecommendation={() => {
              if (!currentRecommendation && id) {
                generateRecommendation({
                  trigger: (triggerType === 'meal_time' ? 'meal_time' : triggerType) || 'planning',
                  groupId: id
                });
              }
              // Navigate to add expense with recommendation
              if (currentRecommendation) {
                navigate(`/add-expense?groupId=${id}&fromRecommendation=true&recommendationId=${currentRecommendation.id}`);
              }
            }}
            onDismiss={() => {
              dismissTrigger();
              if (currentRecommendation) {
                dismissRecommendation(currentRecommendation.id);
              }
            }}
            autoHideAfter={30000}
          />
        )}

        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/my-groups')}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            {t('groups:card.back_to_groups')}
          </Button>
          
          {group && (
            <GroupCard
              group={{
                id: group.id,
                name: group.name,
                currency: group.currency,
                owner_id: group.owner_id,
                created_at: group.created_at || '',
                updated_at: '',
                status: group.status,
                group_type: group.group_type,
              }}
              variant="expanded"
              currentUserId={currentUserId}
              onAddExpense={() => navigate(`/add-expense?groupId=${id}`)}
              onOpenReport={openReport}
              onOpenSettings={() => navigate(`/group/${id}/settings`)}
              onCloseGroup={() => setCloseGroupDialogOpen(true)}
              onDeleteGroup={() => setDeleteGroupDialogOpen(true)}
              onLeaveGroup={() => setLeaveGroupDialogOpen(true)}
              memberCount={memberCount}
              totalExpenses={totals.totalExpenses}
              currencyLabel={currencyLabel}
              groupTypeLabel={group.group_type ? getGroupTypeLabel(group.group_type) : undefined}
              isLoading={loading}
            />
          )}
        </div>

        {/* Closed Group Banner + Pending Ratings */}
        {isGroupClosed && (
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-700">تم إغلاق هذه المجموعة</p>
                  <p className="text-sm text-amber-600/80">لا يمكن إضافة مصاريف أو تعديل الأعضاء</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isGroupClosed && registeredMembers.length > 0 && (
          <PendingRatingsNotification
            groupId={id!}
            members={registeredMembers.map(m => ({
              user_id: m.user_id,
              display_name: profiles[m.user_id]?.display_name,
              name: profiles[m.user_id]?.name,
            }))}
            onStartRating={() => {
              // Find first unrated member to start with
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

        {/* Dice Decision Card - بعد بطاقة المجموعة */}
        {!isGroupClosed && id && (
          <GroupDiceCard
            groupId={id}
            groupType={group?.group_type}
            members={registeredMembers.map(m => ({
              id: m.user_id,
              name: profiles[m.user_id]?.display_name || profiles[m.user_id]?.name || m.user_id.slice(0, 4),
            }))}
            hasOpenDebts={balanceSummary.some(b => Number(b.total_net) !== 0)}
            hasExpenses={expenses.length > 0}
            onOpenAddExpense={({ groupId: gid }) => navigate(`/group/${gid}/add-expense`)}
            onOpenSettleUp={() => openSettlement()}
            onOpenInvite={() => setOpenInvite(true)}
            onOpenWeeklyReport={() => setReportOpen(true)}
            onOpenRenameGroup={({ groupId: gid }) => navigate(`/group/${gid}/settings`)}
            onOpenBudgetSettings={({ groupId: gid }) => navigate(`/group/${gid}/settings?tab=budget`)}
          />
        )}

        {/* Activity Feed */}
        <GroupActivityFeed groupId={id} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Expenses card */}
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-xl cursor-pointer" onClick={() => setActiveTab("expenses")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium text-muted-foreground">المصاريف</p>
              </div>
              <p className="text-2xl font-black text-green-600 leading-none">{totals.approvedExpenses.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{currencyLabel} معتمد</p>
              {totals.pendingExpenses > 0 && (
                <p className="text-[10px] text-amber-600 mt-0.5">معلّق: {totals.pendingExpenses.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          {/* Balance card */}
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-xl cursor-pointer" onClick={() => setActiveTab("settlements")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium text-muted-foreground">رصيدي</p>
              </div>
              <p className={cn("text-2xl font-black leading-none", myBalances.confirmed >= 0 ? "text-green-600" : "text-destructive")}>
                {myBalances.confirmed >= 0 ? '+' : ''}{myBalances.confirmed.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{currencyLabel}</p>
              {Math.abs(myBalances.pending) > 0 && (
                <p className="text-[10px] text-amber-600 mt-0.5">معلّق: {myBalances.pending >= 0 ? '+' : ''}{myBalances.pending.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          {/* Budget card */}
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-xl cursor-pointer" onClick={() => setActiveTab("budget")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium text-muted-foreground">الميزانية</p>
              </div>
              <p className="text-2xl font-black text-accent leading-none">
                {budgetTotals.total > 0 ? budgetTotals.total.toLocaleString() : "—"}
              </p>
              {budgetTotals.total > 0 ? (
                <>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Progress value={budgetTotals.percentage} className="flex-1 h-1.5" />
                    <span className="text-[10px] text-muted-foreground">{budgetTotals.percentage.toFixed(0)}%</span>
                  </div>
                  {budgetAlerts.length > 0 && (
                    <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />{budgetAlerts.length} تنبيه
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-0.5">لم تُحدد بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Members card */}
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-xl cursor-pointer" onClick={() => setActiveTab("members")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium text-muted-foreground">الأعضاء</p>
              </div>
              <p className="text-2xl font-black text-accent leading-none">{memberCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {onlineCount > 0 ? `${onlineCount} متصل الآن` : membersLabel(memberCount)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-muted/60">
            <TabsTrigger value="expenses" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">المصاريف</TabsTrigger>
            <TabsTrigger value="members" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">الأعضاء</TabsTrigger>
            <TabsTrigger value="settlements" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">التسويات</TabsTrigger>
            <TabsTrigger value="budget" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">الميزانية</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs data-[state=active]:shadow-md data-[state=active]:font-bold">الدردشة</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold">المصاريف</h2>
              {!isGroupClosed && (
                <Button onClick={() => navigate(`/add-expense?groupId=${id}`)} variant="hero" size="sm" className="text-xs">
                  <Plus className="w-3.5 h-3.5 me-1" />
                  إضافة مصروف
                </Button>
              )}
            </div>

            {/* Expense Filters */}
            <ExpenseFilters />

            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}
            
            <div className="space-y-2.5">
              {filteredExpenses.map((expense) => {
                const payerName =
                  (expense.payer_id && (profiles[expense.payer_id]?.display_name || profiles[expense.payer_id]?.name)) ||
                  "عضو";
                return (
                  <Card 
                    key={expense.id} 
                    className="bg-card/90 border border-border/50 shadow-card rounded-xl cursor-pointer"
                    onClick={() => setSelectedExpenseForDetails(expense)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                          <Receipt className="w-5 h-5 text-accent" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-1">
                            {expense.description ?? "مصروف"}
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            دفع بواسطة {payerName}
                          </p>
                          
                          {/* Rejection reason */}
                          {expense.status === "rejected" && expense.expense_rejections && expense.expense_rejections.length > 0 && (
                            <div className="mt-1.5 p-2 bg-destructive/5 border border-destructive/10 rounded-lg">
                              <p className="text-[10px] text-destructive/80 leading-relaxed line-clamp-2">
                                {expense.expense_rejections[0].rejection_reason || "لم يتم تحديد سبب"}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Amount & Status */}
                        <div className="text-left shrink-0 flex flex-col items-end gap-1">
                          <p className="text-xl font-black text-accent leading-none">
                            {Number(expense.amount).toLocaleString()}
                            <span className="text-[10px] font-medium text-muted-foreground ms-0.5">{expense.currency || "SAR"}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(expense.spent_at ?? expense.created_at ?? "").toString().slice(0, 10)}
                          </p>
                          {/* Single status badge */}
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

                          {/* Action buttons - smaller and less prominent */}
                          {expense.status === "pending" && canApprove && (
                            <div className="flex gap-1 mt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "approve"); }}
                                className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-green-600"
                                aria-label="اعتماد"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "reject"); }}
                                className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-destructive"
                                aria-label="رفض"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setExpenseToDelete(expense);
                                    setDeleteExpenseConfirmOpen(true);
                                  }}
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100 text-destructive"
                                  aria-label="حذف"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {/* Delete for non-pending (admin) */}
                          {isAdmin && expense.status !== "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setExpenseToDelete(expense);
                                setDeleteExpenseConfirmOpen(true);
                              }}
                              className="h-6 w-6 p-0 opacity-50 hover:opacity-100 text-destructive mt-1"
                              aria-label="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {expense.status === "rejected" && currentUserId === expense.payer_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleEditExpense(expense); }}
                              className="text-[10px] h-6 px-2 opacity-70 hover:opacity-100 mt-1"
                            >
                              <Edit className="w-3 h-3 me-0.5" />
                              تعديل
                            </Button>
                          )}
                          
                          {(expense.status === "pending" || expense.status === "rejected") && currentUserId === expense.payer_id && !canApprove && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleEditExpense(expense); }}
                              className="text-[10px] h-6 px-2 opacity-70 hover:opacity-100 mt-1"
                            >
                              <Edit className="w-3 h-3 me-0.5" />
                              تعديل
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

          {/* Members Tab */}
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

            {/* Pending Invites Section */}
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
                  <MemberCard
                    key={member.user_id}
                    member={{
                      ...member,
                      profile: memberProfile
                    }}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    canAdmin={canApprove}
                    groupId={id!}
                    onMemberRemoved={forceRefresh}
                    planConfig={memberPlanConfig}
                    balance={memberBalance}
                    pendingAmount={memberPending}
                    currency={currencyLabel}
                    allBalances={balances}
                    profiles={profiles}
                  />
                );
              })}
              {!loading && registeredMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">لا يوجد أعضاء حتى الآن.</p>
              )}
            </div>

            {/* Pending/Invited Members Section */}
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
                    <PendingMemberCard
                      key={member.id}
                      member={member}
                      isAdmin={isAdmin || isOwner}
                      groupId={id!}
                      onRemoved={forceRefresh}
                    />
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">التسويات</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openSettlement()}>
                  إضافة تسوية
                </Button>
                {myBalances.confirmed < 0 && (
                  <Button variant="hero" onClick={() => {
                    const creditors = balances.filter(b => b.user_id !== currentUserId && Number(b.net_balance ?? 0) > 0);
                    if (creditors.length) {
                      const c = creditors[0];
                      const amt = Math.min(-myBalances.confirmed, Number(c.net_balance ?? 0));
                      setPrefillTo(c.user_id);
                      setPrefillAmount(amt);
                    } else {
                      setPrefillTo(undefined); setPrefillAmount(undefined);
                    }
                    openSettlement(prefillTo, prefillAmount);
                  }}>
                    تسوية الآن
                  </Button>
                )}
              </div>
            </div>

            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}

            {!loading && !error && currentUserId && (
              <BalanceDashboard
                currentUserId={currentUserId}
                balances={balances}
                pendingAmounts={pendingAmounts}
                settlements={settlements}
                profiles={profiles}
                currency={currencyLabel}
                hasUnconfirmedMembers={members.some(m => (m as any).status === 'invited' || (m as any).status === 'pending')}
                onSettleClick={(toUserId, amount) => {
                  openSettlement(toUserId, amount);
                }}
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
                          <div className="font-semibold">
                            {nameOf(s.from_user_id)} → {nameOf(s.to_user_id)}
                          </div>
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
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف
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

          {/* Budgets Tab */}
          <TabsContent value="budget">
            <div className="space-y-6">
              {/* Smart Budget Actions */}
              <BudgetQuickActions
                groupId={id!}
                groupName={group?.name}
                groupType={group?.group_type}
                memberCount={memberCount}
                budgetCount={budgets.length}
                totalBudget={budgetTotals.total}
                totalSpent={budgetTotals.spent}
                onCreateBudget={async (budgetData) => {
                  try {
                    const newBudget = await createBudget({
                      name: budgetData.name,
                      total_amount: budgetData.total_amount,
                      amount_limit: budgetData.amount_limit || budgetData.total_amount,
                      group_id: budgetData.group_id,
                      period: budgetData.period || "monthly",
                      start_date: budgetData.start_date || new Date().toISOString().split('T')[0],
                      end_date: budgetData.end_date,
                      budget_type: budgetData.budget_type || "monthly",
                      category_id: budgetData.category_id
                    });
                    
                    // If budget has categories, create budget_categories entries
                    if (budgetData.categories && budgetData.categories.length > 0) {
                      // This will be handled by the useBudgetFromAI or similar hook
                      console.log("Budget with categories created:", newBudget);
                    }
                  } catch (error) {
                    console.error("Error creating budget:", error);
                    throw error;
                  }
                }}
                isCreating={isCreating}
              />

              {budgetLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
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
                      const progress = categoryBudget.spent_percentage;
                      const spent = categoryBudget.spent_amount;
                      const remaining = categoryBudget.remaining_amount;

                      // Create a budget object for BudgetProgressCard
                      const budgetForCard = {
                        id: categoryBudget.category_id || '',
                        name: categoryBudget.category_name || 'فئة غير محددة',
                        total_amount: categoryBudget.budgeted_amount,
                        period: 'monthly' as const,
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        created_by: '',
                        group_id: id!,
                        category_id: categoryBudget.category_id,
                        budget_type: 'monthly' as const,
                        amount_limit: categoryBudget.budgeted_amount,
                        starts_on: null
                      };

                      return (
                        <BudgetProgressCard
                          key={`category-${categoryBudget.category_id}`}
                          budget={budgetForCard}
                          progress={progress}
                          spent={spent}
                          remaining={remaining}
                          onEdit={() => {
                            setEditingBudget(budgetForCard);
                            setEditBudgetOpen(true);
                          }}
                          onDelete={() => {
                            setDeletingBudget(budgetForCard);
                            setDeleteBudgetOpen(true);
                          }}
                          formatCurrency={(amount) => formatCurrency(amount, group?.currency || 'SAR')}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">لا توجد ميزانيات بعد</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    ابدأ بإنشاء ميزانية لتتبع مصاريف المجموعة
                  </p>
                </div>
              )}

              {/* Budget Alerts */}
              {budgetAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-600">تنبيهات الميزانية</h4>
                  {budgetAlerts.map((alert, index) => (
                    <Card key={index} className="border-amber-200 bg-amber-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <p className="text-sm font-medium text-amber-800">
                            {getAlertMessage(alert)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  دردشة المجموعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {id ? (
                  <GroupChat groupId={id} />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">الدردشة</h2>
                      <Button variant="outline">
                        <MoreHorizontal className="w-4 h-4 ml-2" />
                        المزيد من الخيارات
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="اكتب رسالتك..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage} variant="hero">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      <GroupSettlementDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        groupId={id}
        currentUserId={currentUserId}
        members={registeredMembers}
        profiles={profiles}
        balances={balances}
        pendingAmounts={pendingAmounts}
        initialToUserId={prefillTo}
        initialAmount={prefillAmount}
        onCreated={() => refetch()}
        groupCurrency={groupCurrency}
      />

      <SettlementGuardDialog
        open={settlementGuardOpen}
        onOpenChange={setSettlementGuardOpen}
        onProceedActiveOnly={() => {
          setSettlementGuardOpen(false);
          setSettleOpen(true);
        }}
      />

      <EditExpenseDialog
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
        expense={selectedExpense}
        onUpdated={() => refetch()}
      />

      <RejectExpenseDialog
        open={rejectExpenseOpen}
        onOpenChange={setRejectExpenseOpen}
        expenseId={selectedExpense?.id}
        expenseDescription={selectedExpense?.description || ""}
        onRejected={() => refetch()}
      />

      {/* Expense Details Dialog */}
      <ExpenseDetailsDialog
        open={!!selectedExpenseForDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedExpenseForDetails(null);
        }}
        expense={selectedExpenseForDetails}
        profiles={profiles}
        canApprove={canApprove}
        onApprove={handleExpenseApproval}
        isAdmin={isAdmin}
        onDeleted={() => refetch()}
      />

      {/* Delete Expense Confirmation Dialog */}
      <AlertDialog open={deleteExpenseConfirmOpen} onOpenChange={setDeleteExpenseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
              <br />
              <strong className="text-foreground">{expenseToDelete?.description}</strong> - {Number(expenseToDelete?.amount || 0).toLocaleString()} {expenseToDelete?.currency}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (expenseToDelete) {
                  const success = await deleteExpense(expenseToDelete.id);
                  if (success) {
                    setDeleteExpenseConfirmOpen(false);
                    setExpenseToDelete(null);
                    refetch();
                  }
                }
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingExpense}
            >
              {deletingExpense ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Budget Dialog */}
      <CreateBudgetDialog
        open={createBudgetOpen}
        onOpenChange={setCreateBudgetOpen}
        onCreateBudget={async (data) => {
          await createBudget({ ...data, group_id: id! });
          setCreateBudgetOpen(false);
          refetch();
        }}
        isCreating={isCreating}
      />

      {/* Edit Budget Dialog */}
      <EditBudgetDialog
        open={editBudgetOpen}
        onOpenChange={setEditBudgetOpen}
        budget={editingBudget}
        onUpdate={async (budgetId, updates) => {
          await updateBudget({ id: budgetId, ...updates });
          setEditBudgetOpen(false);
          setEditingBudget(null);
        }}
        isUpdating={isCreating}
      />

      {/* Delete Budget Dialog */}
      <DeleteBudgetDialog
        open={deleteBudgetOpen}
        onOpenChange={setDeleteBudgetOpen}
        budget={deletingBudget}
        onConfirm={async () => {
          if (deletingBudget) {
            await deleteBudget(deletingBudget.id);
            setDeleteBudgetOpen(false);
            setDeletingBudget(null);
          }
        }}
        isDeleting={isCreating}
      />

      {/* Delete Group Dialog */}
      <DeleteGroupDialog
        open={deleteGroupDialogOpen}
        onOpenChange={setDeleteGroupDialogOpen}
        groupName={group?.name || ""}
        onConfirm={handleDeleteGroup}
        isDeleting={isDeletingGroup}
      />

      {/* Leave Group Dialog */}
      <LeaveGroupDialog
        open={leaveGroupDialogOpen}
        onOpenChange={setLeaveGroupDialogOpen}
        groupName={group?.name || ""}
        onConfirm={handleLeaveGroup}
        isLeaving={isLeavingGroup}
      />

      {/* Close Group Dialog */}
      <CloseGroupDialog
        open={closeGroupDialogOpen}
        onOpenChange={setCloseGroupDialogOpen}
        onConfirm={async () => {
          const success = await closeGroup();
          if (success) {
            setCloseGroupDialogOpen(false);
            refetch();
          }
        }}
        loading={closingGroup}
        groupName={group?.name}
      />
      {/* Rating Sheet */}
      {memberToRate && (
        <RatingSheet
          open={ratingSheetOpen}
          onOpenChange={setRatingSheetOpen}
          groupId={id!}
          member={memberToRate}
          onRatingSubmitted={() => {
            setMemberToRate(null);
            refetch();
          }}
        />
      )}
      </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
      
      {/* Profile Completion Sheet - shown after joining */}
      <ProfileCompletionSheet
        open={showProfileCompletion}
        onOpenChange={setShowProfileCompletion}
      />
    </div>
  );
};

export default GroupDetails;
