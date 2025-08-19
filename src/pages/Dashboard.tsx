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
import { SmartPromotionBanner } from "@/components/promotions/SmartPromotionBanner";
import { ContextualAdBanner } from "@/components/ads/ContextualAdBanner";
import { SmartAdSidebar } from "@/components/ads/SmartAdSidebar";
import { AdPreferencesDialog } from "@/components/ads/AdPreferencesDialog";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleStatsGrid } from "@/components/dashboard/SimpleStatsGrid";
import { SimpleQuickActions } from "@/components/dashboard/SimpleQuickActions";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { UsageLimitsCard } from "@/components/dashboard/UsageLimitsCard";
import { QuotaWarningBanner } from "@/components/quota/QuotaWarningBanner";
import { QuotaUpgradeDialog } from "@/components/quota/QuotaUpgradeDialog";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const [showGuide, setShowGuide] = useState(false);
  
  const {
    myPaid,
    myOwed,
    monthlyTotalExpenses,
    weeklyExpensesCount,
    groupsCount,
    loading,
    error,
    refetch
  } = useDashboardData();

  const { 
    checkQuotaWarning, 
    upgradeDialogOpen, 
    setUpgradeDialogOpen, 
    currentQuotaType,
    isFreePlan 
  } = useQuotaHandler();
  
  const { limits } = useSubscriptionLimits();

  // Check for quota warnings
  const quotaWarnings = limits && isFreePlan ? [
    { type: 'groups', usage: groupsCount || 0, limit: limits.groups },
    { type: 'expenses', usage: weeklyExpensesCount || 0, limit: limits.expenses },
  ].map(({ type, usage, limit }) => ({
    type,
    usage,
    limit,
    ...checkQuotaWarning(usage, limit, type)
  })).filter(warning => warning.showWarning || warning.showCritical) : [];

  const retryLoad = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container space-y-4">
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
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container">
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
      
      <div className="page-container space-y-6">
        {/* Quota Warning Banners */}
        {quotaWarnings.length > 0 && (
          <div className="space-y-2">
            {quotaWarnings.map(warning => (
              <QuotaWarningBanner
                key={warning.type}
                type={warning.type!}
                quotaType={warning.type}
                currentUsage={warning.usage}
                limit={warning.limit}
                percentage={warning.percentage}
              />
            ))}
          </div>
        )}

        {/* Smart Promotion System */}
        <SmartPromotionBanner />

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
          groupsCount={groupsCount}
          weeklyExpensesCount={weeklyExpensesCount}
          myPaid={myPaid}
          myOwed={myOwed}
        />

        {/* Subscription and Usage Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SubscriptionStatusCard />
          <UsageLimitsCard />
          
          {/* Smart Ad Sidebar */}
          <SmartAdSidebar />
        </div>
        
        {/* Contextual Ads */}
        <ContextualAdBanner
          context={{ type: 'dashboard' }}
          placement="dashboard_main"
          className="mt-4"
        />
        
        {/* Ad Preferences */}
        <div className="flex justify-center">
          <AdPreferencesDialog />
        </div>

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

        {/* Quick Actions - Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <SimpleQuickActions />
          </div>
        </div>
      </div>
      
      {/* App Guide */}
      {showGuide && <AppGuide onClose={() => setShowGuide(false)} />}

      {/* Quota Upgrade Dialog */}
      {limits && (
        <QuotaUpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          quotaType={currentQuotaType}
          currentUsage={
            currentQuotaType === 'groups' ? (groupsCount || 0) :
            currentQuotaType === 'expenses' ? (weeklyExpensesCount || 0) :
            0
          }
          limit={
            currentQuotaType === 'groups' ? limits.groups :
            currentQuotaType === 'expenses' ? limits.expenses :
            0
          }
        />
      )}
      
      <div className="h-24" />
      <BottomNav />
    </div>
  );
};

export default Dashboard;