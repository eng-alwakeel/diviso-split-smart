import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, HelpCircle, Shield } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AppGuide } from "@/components/AppGuide";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleStatsGrid } from "@/components/dashboard/SimpleStatsGrid";
import { SimpleGroupsList } from "@/components/dashboard/SimpleGroupsList";
import { SimpleExpensesList } from "@/components/dashboard/SimpleExpensesList";
import { SimpleQuickActions } from "@/components/dashboard/SimpleQuickActions";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const [showGuide, setShowGuide] = useState(false);
  
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

  const retryLoad = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <div className="h-24" />
        <BottomNav />
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
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Welcome Section */}
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

        {/* Stats Grid */}
        <SimpleStatsGrid
          monthlyTotalExpenses={monthlyTotalExpenses}
          groupsCount={groups.length}
          weeklyExpensesCount={weeklyExpensesCount}
          myPaid={myPaid}
          myOwed={myOwed}
        />

        {/* Admin Dashboard Card - Only for Admins */}
        {adminData?.isAdmin && (
          <Card 
            className="border border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer" 
            onClick={() => navigate('/admin-dashboard')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">لوحة التحكم الإدارية</p>
                  <p className="text-xs text-muted-foreground mt-1">إدارة النظام والمستخدمين</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups and Expenses */}
          <div className="lg:col-span-2 space-y-6">
            <SimpleGroupsList
              groups={groups}
              groupPaidMap={groupPaidMap}
              groupOwedMap={groupOwedMap}
            />
            
            <SimpleExpensesList
              expenses={recentExpenses}
              groups={groups}
              mySplitByExpense={mySplitByExpense}
              currentUserId={currentUserId}
            />
          </div>

          {/* Sidebar */}
          <div>
            <SimpleQuickActions />
          </div>
        </div>
      </div>
      
      {/* App Guide */}
      {showGuide && <AppGuide onClose={() => setShowGuide(false)} />}
      
      <div className="h-24" />
      <BottomNav />
    </div>
  );
};

export default Dashboard;