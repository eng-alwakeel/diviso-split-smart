import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Users, 
  Receipt, 
  TrendingUp, 
  Gift, 
  Calendar,
  DollarSign,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Share2,
  BarChart3,
  Settings,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { WalletStack } from "@/components/wallet/WalletStack";
import RecentExpensesCards from "@/components/RecentExpensesCards";
import MobileSummary from "@/components/MobileSummary";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";

interface GroupRow {
  id: string;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { referrals, loading: referralsLoading } = useReferrals();
  
  const [selectedTab, setSelectedTab] = useState("overview");
  const [groups, setGroups] = useState<Array<{ id: string; name: string; members: number; expenses: number; totalExpenses: number; category?: string }>>([]);
  const [recentExpenses, setRecentExpenses] = useState<Array<{ id: string; description: string | null; amount: number; group_id: string; spent_at: string | null; created_at: string | null; payer_id: string | null }>>([]);
  const [myPaid, setMyPaid] = useState(0);
  const [myOwed, setMyOwed] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupPaidMap, setGroupPaidMap] = useState<Record<string, number>>({});
  const [groupOwedMap, setGroupOwedMap] = useState<Record<string, number>>({});
  const [mySplitByExpense, setMySplitByExpense] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyTotalExpenses, setMonthlyTotalExpenses] = useState(0);
  const [weeklyExpensesCount, setWeeklyExpensesCount] = useState(0);
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        setCurrentUserId(uid ?? null);
        if (!uid) {
          setLoading(false);
          return;
        }
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', uid);
      const ids = (memberships ?? []).map((m: any) => m.group_id);
      if (!ids.length) { 
        setGroups([]); 
        setRecentExpenses([]); 
        setMyPaid(0); 
        setMyOwed(0); 
        setGroupPaidMap({});
        setGroupOwedMap({});
        setSelectedGroupId(null);
        localStorage.removeItem('selectedGroupId');
        return; 
      }
      const { data: groupsData } = await supabase.from('groups').select('id,name').in('id', ids);
      const { data: memberRows } = await supabase.from('group_members').select('group_id').in('group_id', ids);
      const memberCount: Record<string, number> = {};
      (memberRows ?? []).forEach((r: any) => { memberCount[r.group_id] = (memberCount[r.group_id] || 0) + 1; });
      const { data: expenseRows } = await supabase.from('expenses').select('id, group_id, amount, payer_id').in('group_id', ids);
      const totals: Record<string, number> = {}; const counts: Record<string, number> = {};
      const expenseIdToGroup: Record<string, string> = {};
      (expenseRows ?? []).forEach((e: any) => { 
        totals[e.group_id] = (totals[e.group_id] || 0) + Number(e.amount || 0); 
        counts[e.group_id] = (counts[e.group_id] || 0) + 1; 
        expenseIdToGroup[e.id] = e.group_id; 
      });

      // Totals for current user (overall and per group)
      const paidByGroup: Record<string, number> = {};
      const paidTotal = (expenseRows ?? []).reduce((s: number, e: any) => {
        if (e.payer_id === uid) {
          paidByGroup[e.group_id] = (paidByGroup[e.group_id] || 0) + Number(e.amount || 0);
          return s + Number(e.amount || 0);
        }
        return s;
      }, 0);

      let owedTotal = 0;
      const owedByGroup: Record<string, number> = {};
      const mySplitMap: Record<string, number> = {};
      const expenseIds = (expenseRows ?? []).map((e: any) => e.id);
      if (expenseIds.length) {
        const { data: mySplits } = await supabase
          .from('expense_splits')
          .select('expense_id, share_amount')
          .eq('member_id', uid)
          .in('expense_id', expenseIds);
        (mySplits ?? []).forEach((sp: any) => {
          const gid = expenseIdToGroup[sp.expense_id];
          mySplitMap[sp.expense_id] = Number(sp.share_amount || 0);
          if (gid) {
            owedByGroup[gid] = (owedByGroup[gid] || 0) + Number(sp.share_amount || 0);
            owedTotal += Number(sp.share_amount || 0);
          }
        });
      }
      setMySplitByExpense(mySplitMap);
      setMyPaid(paidTotal);
      setMyOwed(owedTotal);
      setGroupPaidMap(paidByGroup);
      setGroupOwedMap(owedByGroup);

      const mapped = (groupsData ?? []).map((g: GroupRow) => ({
        id: g.id,
        name: g.name,
        members: memberCount[g.id] || 0,
        expenses: counts[g.id] || 0,
        totalExpenses: totals[g.id] || 0,
        category: undefined,
      }));
      setGroups(mapped);

      // Default selected group: last in array (top of stack) or saved value
      let defaultSelected = localStorage.getItem('selectedGroupId');
      const idsSet = new Set(mapped.map((g) => g.id));
      if (!defaultSelected || !idsSet.has(defaultSelected)) {
        defaultSelected = mapped.length ? mapped[mapped.length - 1].id : null as any;
      }
      setSelectedGroupId(defaultSelected);

      const { data: latest } = await supabase
        .from('expenses')
        .select('id, description, amount, group_id, spent_at, created_at, payer_id')
        .in('group_id', ids)
        .order('spent_at', { ascending: false })
        .limit(10);
      setRecentExpenses(latest ?? []);

      // Calculate monthly total expenses (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('payer_id', uid)
        .gte('spent_at', startOfMonth.toISOString());
        
      const monthlyTotal = (monthlyExpenses ?? []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      setMonthlyTotalExpenses(monthlyTotal);

      // Calculate weekly expenses count
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyExpenses } = await supabase
        .from('expenses')
        .select('id')
        .in('group_id', ids)
        .gte('spent_at', weekAgo.toISOString());
        
      setWeeklyExpensesCount((weeklyExpenses ?? []).length);

      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError('فشل في تحميل بيانات الداشبورد');
        toast({
          title: "خطأ في التحميل",
          description: "فشل في تحميل بيانات الداشبورد",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const navigateToSelectedGroup = () => {
    if (selectedGroupId) {
      navigate(`/group/${selectedGroupId}`);
    }
  };

  const selectGroup = (id: string) => {
    if (id === selectedGroupId) {
      // If user clicks the same selected group again, navigate to its details
      navigate(`/group/${id}`);
      return;
    }
    setSelectedGroupId(id);
    localStorage.setItem('selectedGroupId', id);
  };
  const goPrev = () => {
    if (!groups.length) return;
    const idx = groups.findIndex((g) => g.id === (selectedGroupId ?? ""));
    const prevIdx = idx <= 0 ? groups.length - 1 : idx - 1;
    selectGroup(groups[prevIdx].id);
  };
  const goNext = () => {
    if (!groups.length) return;
    const idx = groups.findIndex((g) => g.id === (selectedGroupId ?? ""));
    const nextIdx = idx === -1 || idx >= groups.length - 1 ? 0 : idx + 1;
    selectGroup(groups[nextIdx].id);
  };

  const selectedPaid = selectedGroupId ? (groupPaidMap[selectedGroupId] ?? 0) : myPaid;
  const selectedOwed = selectedGroupId ? (groupOwedMap[selectedGroupId] ?? 0) : myOwed;

  const monthlyBudget = 2000;
  const currentSpending = groups.reduce((s, g) => s + g.totalExpenses, 0);
  const budgetProgress = (currentSpending / monthlyBudget) * 100;
  
  const successfulReferrals = referrals.filter(r => r.status === 'joined').length;

  const retryLoad = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full" />
              </div>
              <div>
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">حدث خطأ</h2>
            <p className="text-muted-foreground text-center">{error}</p>
            <Button onClick={retryLoad} className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 hidden md:block">
          <h1 className="text-3xl font-bold text-foreground mb-2">مرحباً بك في ديفيزو!</h1>
          <p className="text-muted-foreground">إدارة ذكية للمصاريف المشتركة</p>
        </div>

        {/* Mobile Summary */}
        <div className="md:hidden mb-6">
          <MobileSummary
            paid={selectedPaid}
            owed={selectedOwed}
            totalExpenses={currentSpending}
            groupsCount={groups.length}
            recentCount={recentExpenses.length}
          />
        </div>
        {/* Quick Stats Cards */}
        <div className="hidden md:grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Expenses Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصاريف</p>
                  <p className="text-2xl font-bold text-primary">{monthlyTotalExpenses.toLocaleString()} ر.س</p>
                  <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Groups Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">المجموعات النشطة</p>
                  <p className="text-2xl font-bold text-primary">{groups.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">مجموعات</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">المصاريف الأخيرة</p>
                  <p className="text-2xl font-bold text-primary">{weeklyExpensesCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">خلال الأسبوع</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referrals Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">الإحالات</p>
                  <p className="text-2xl font-bold text-primary">{referralsLoading ? '-' : successfulReferrals}</p>
                  <p className="text-xs text-muted-foreground mt-1">إحالات ناجحة</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">مجموعاتي</h2>
              <Button 
                onClick={() => navigate('/create-group')} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء مجموعة جديدة
              </Button>
            </div>
            

            {/* Wallet-style stacked group cards */}
            <div className="mt-4">
              {groups.length === 0 ? (
                <div className="p-4 rounded-xl border border-border bg-card text-muted-foreground text-sm">
                  لا توجد مجموعات حتى الآن.
                </div>
              ) : (
                <WalletStack
                  items={groups.map((g) => ({ id: g.id, name: g.name, totalPaid: groupPaidMap[g.id] ?? 0, totalOwed: groupOwedMap[g.id] ?? 0 }))}
                  selectedId={selectedGroupId ?? undefined}
                  onSelect={selectGroup}
                  onPrev={goPrev}
                  onNext={goNext}
                />
              )}
            </div>

            {/* Recent Expenses - moved to full width under groups */}
            <Card className="bg-card border border-border rounded-2xl mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Receipt className="w-5 h-5 text-primary" />
                  المصاريف الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0 sm:p-6">
                <RecentExpensesCards
                  items={recentExpenses.map((e) => ({
                    id: e.id,
                    title: e.description ?? 'مصروف',
                    amount: Number(e.amount ?? 0),
                    date: (e.spent_at ?? e.created_at ?? '').toString().slice(0, 10),
                    groupName: groups.find(g => g.id === e.group_id)?.name ?? '',
                    myShare: mySplitByExpense[e.id],
                    isPayer: !!(e.payer_id && currentUserId && e.payer_id === currentUserId),
                  }))}
                />
                <div className="p-4 pt-0 sm:p-0">
                  <Button 
                    variant="outline" 
                    className="w-full border-border hover:bg-secondary"
                    onClick={() => navigate('/add-expense')}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مصروف جديد
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Expenses moved to main content */}
            {/* Quick Actions */}
            <Card className="bg-card border border-border rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Target className="w-5 h-5 text-primary" />
                  إجراءات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-secondary justify-start"
                  onClick={() => navigate('/financial-plan')}
                >
                  <BarChart3 className="w-4 h-4 ml-2" />
                  عرض الخطة المالية
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-secondary justify-start"
                  onClick={() => navigate('/referral')}
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  مركز الإحالة
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-secondary justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 ml-2" />
                  الإعدادات
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="h-24 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default Dashboard;