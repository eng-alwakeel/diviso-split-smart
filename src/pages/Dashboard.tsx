import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, HelpCircle, Plus, Users, Receipt, Target, BarChart3, Share2, Settings, Shield } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import MobileSummary from "@/components/MobileSummary";
import { AppGuide } from "@/components/AppGuide";
import { useDashboardData } from "@/hooks/useDashboardData";
import { QuickStatsCards } from "@/components/dashboard/QuickStatsCards";
import { MainContent } from "@/components/dashboard/MainContent";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStack } from "@/components/wallet/WalletStack";
import RecentExpensesCards from "@/components/RecentExpensesCards";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const {
    groups,
    recentExpenses,
    myPaid,
    myOwed,
    groupPaidMap,
    groupOwedMap,
    mySplitByExpense,
    monthlyTotalExpenses,
    weeklyExpensesCount,
    currentUserId,
    loading,
    error,
    refetch
  } = useDashboardData();

  // Initialize selected group
  useState(() => {
    if (groups.length > 0) {
      let defaultSelected = localStorage.getItem('selectedGroupId');
      const idsSet = new Set(groups.map((g) => g.id));
      if (!defaultSelected || !idsSet.has(defaultSelected)) {
        defaultSelected = groups[groups.length - 1].id;
      }
      setSelectedGroupId(defaultSelected);
    }
  });

  const selectGroup = (id: string) => {
    if (id === selectedGroupId) {
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

  const retryLoad = () => {
    refetch();
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
        <div className="mb-6 hidden md:block">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">مرحباً بك!</h1>
              <p className="text-muted-foreground text-sm">إدارة ذكية للمصاريف المشتركة</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuide(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4 ml-2" />
              المساعدة
            </Button>
          </div>
        </div>

        {/* Mobile Summary */}
        <div className="md:hidden mb-6">
          <MobileSummary
            paid={selectedPaid}
            owed={selectedOwed}
            totalExpenses={groups.reduce((s, g) => s + g.totalExpenses, 0)}
            groupsCount={groups.length}
            recentCount={recentExpenses.length}
          />
        </div>
        {/* Quick Stats Cards */}
        <div className="hidden md:block">
          <QuickStatsCards
            monthlyTotalExpenses={monthlyTotalExpenses}
            groupsCount={groups.length}
            weeklyExpensesCount={weeklyExpensesCount}
          />
        </div>

        {/* Admin Dashboard Card - Only for Admins */}
        {adminData?.isAdmin && (
          <div className="hidden md:block mb-6">
            <Card 
              className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl hover:scale-[1.02] hover:border-primary/50" 
              onClick={() => navigate('/admin-dashboard')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-foreground">
                    <p className="text-sm font-medium text-primary">لوحة التحكم الإدارية</p>
                    <p className="text-xs text-muted-foreground mt-1">إدارة النظام والمستخدمين</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">آخر 5 مجموعات</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/my-groups')} 
                  className="border-border hover:bg-secondary text-sm"
                >
                  عرض الكل
                </Button>
                <Button 
                  onClick={() => navigate('/create-group')} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء مجموعة
                </Button>
              </div>
            </div>
            

            {/* Wallet-style stacked group cards - show only last 5 */}
            <div className="mt-4">
              {groups.length === 0 ? (
                <div className="p-6 rounded-xl border border-border bg-card text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">لا توجد مجموعات حتى الآن</p>
                  <Button 
                    onClick={() => navigate('/create-group')} 
                    className="mt-3 bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    إنشاء أول مجموعة
                  </Button>
                </div>
              ) : (
                <WalletStack
                  items={groups.slice(-5).map((g) => ({ id: g.id, name: g.name, totalPaid: groupPaidMap[g.id] ?? 0, totalOwed: groupOwedMap[g.id] ?? 0 }))}
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <Receipt className="w-5 h-5 text-primary" />
                    آخر 5 مصاريف
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/my-expenses')} 
                    className="border-border hover:bg-secondary text-sm"
                    size="sm"
                  >
                    عرض الكل
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0 sm:p-6">
                {recentExpenses.length === 0 ? (
                  <div className="p-6 text-center">
                    <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">لا توجد مصاريف حتى الآن</p>
                    <Button 
                      onClick={() => navigate('/add-expense')} 
                      className="mt-3 bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      إضافة أول مصروف
                    </Button>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
      
      {/* App Guide */}
      {showGuide && <AppGuide onClose={() => setShowGuide(false)} />}
      
      <div className="h-24 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default Dashboard;