import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AppGuide } from "@/components/AppGuide";
import { useOptimizedDashboardData } from "@/hooks/useOptimizedQueries";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SmartPromotionBanner } from "@/components/promotions/SmartPromotionBanner";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { Card } from "@/components/ui/card";
import { SimpleStatsGrid } from "@/components/dashboard/SimpleStatsGrid";
import { SimpleQuickActions } from "@/components/dashboard/SimpleQuickActions";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { UsageLimitsCard } from "@/components/dashboard/UsageLimitsCard";
import { QuotaWarningBanner } from "@/components/quota/QuotaWarningBanner";
import { QuotaUpgradeDialog } from "@/components/quota/QuotaUpgradeDialog";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { FixedStatsAdBanner } from "@/components/ads/FixedStatsAdBanner";
import DailyCheckInCard from "@/components/dashboard/DailyCheckInCard";
import { OnboardingProgress } from "@/components/dashboard/OnboardingProgress";
import { useTranslation } from "react-i18next";
import { useAchievements } from "@/hooks/useAchievements";
import { ShareableAchievementCard } from "@/components/achievements/ShareableAchievementCard";
import { AchievementPopup } from "@/components/achievements/AchievementPopup";
import { MonthlyWrapCard } from "@/components/achievements/MonthlyWrapCard";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardRealtimeListener } from "@/hooks/useUnifiedRealtimeListener";

const Dashboard = React.memo(() => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [userId, setUserId] = useState<string>();
  
  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  // Use unified real-time listener (reduces connections from 7+ to 1)
  useDashboardRealtimeListener(userId || null);
  
  // Achievements hook
  const { latestUnshared, unsharedCount, monthlyStats } = useAchievements();
  
  const {
    data: dashboardData,
    isLoading: loading,
    error,
    refetch
  } = useOptimizedDashboardData(userId);

  const myPaid = dashboardData?.myPaid ?? 0;
  const myOwed = dashboardData?.myOwed ?? 0;
  const monthlyTotalExpenses = dashboardData?.monthlyTotalExpenses ?? 0;
  const weeklyExpensesCount = dashboardData?.weeklyExpensesCount ?? 0;
  const groupsCount = dashboardData?.groupsCount ?? 0;
  const {
    checkQuotaWarning,
    upgradeDialogOpen,
    setUpgradeDialogOpen,
    currentQuotaType,
    isFreePlan
  } = useQuotaHandler();
  const {
    limits
  } = useSubscriptionLimits();

  // Memoized callbacks for better performance
  const handleShowGuide = useCallback(() => setShowGuide(true), []);
  const handleCloseGuide = useCallback(() => setShowGuide(false), []);
  const handleRetry = useCallback(() => refetch(), [refetch]);

  // Check for quota warnings with memoization
  const quotaWarnings = useMemo(() => {
    if (!limits || !isFreePlan) return [];
    return [{
      type: 'groups',
      usage: groupsCount || 0,
      limit: limits.groups
    }, {
      type: 'expenses',
      usage: weeklyExpensesCount || 0,
      limit: limits.expenses
    }].map(({
      type,
      usage,
      limit
    }) => ({
      type,
      usage,
      limit,
      ...checkQuotaWarning(usage, limit, type)
    })).filter(warning => warning.showWarning || warning.showCritical);
  }, [limits, isFreePlan, groupsCount, weeklyExpensesCount, checkQuotaWarning]);

  // Memoized quota dialog props
  const quotaDialogProps = useMemo(() => ({
    open: upgradeDialogOpen,
    onOpenChange: setUpgradeDialogOpen,
    quotaType: currentQuotaType,
    currentUsage: currentQuotaType === 'groups' ? groupsCount || 0 : currentQuotaType === 'expenses' ? weeklyExpensesCount || 0 : 0,
    limit: currentQuotaType === 'groups' ? limits?.groups : currentQuotaType === 'expenses' ? limits?.expenses : 0
  }), [upgradeDialogOpen, setUpgradeDialogOpen, currentQuotaType, groupsCount, weeklyExpensesCount, limits]);
  if (loading) {
    return <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
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
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">{t('dashboard:error.title')}</h2>
            <p className="text-muted-foreground text-center">{error?.message || t('dashboard:error.unexpected')}</p>
            <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 ml-2" />
              {t('dashboard:error.retry')}
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="dashboard"
        showTopBanner={false}
        showBottomBanner={false}
      >
        <div className="page-container space-y-6">
          {/* Quota Warning Banners */}
          {quotaWarnings.length > 0 && <div className="space-y-2">
              {quotaWarnings.map(warning => <QuotaWarningBanner key={warning.type} type={warning.type!} quotaType={warning.type} currentUsage={warning.usage} limit={warning.limit} percentage={warning.percentage} />)}
            </div>}

          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{t('dashboard:welcome')}</h1>
              <p className="text-muted-foreground text-sm">{t('dashboard:subtitle')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShowGuide} className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-4 h-4 ml-2" />
              {t('dashboard:help')}
            </Button>
          </div>

          {/* Onboarding Progress Card */}
          <OnboardingProgress />

          {/* Daily Check-in Card */}
          <DailyCheckInCard />

          {/* Stats Grid */}
          <SimpleStatsGrid monthlyTotalExpenses={monthlyTotalExpenses} groupsCount={groupsCount} weeklyExpensesCount={weeklyExpensesCount} myPaid={myPaid} myOwed={myOwed} />

          {/* Fixed Ad Banner Below Stats */}
          <FixedStatsAdBanner placement="dashboard_stats" />

          {/* Latest Unshared Achievement */}
          {latestUnshared && (
            <ShareableAchievementCard achievement={latestUnshared} compact />
          )}

          {/* Monthly Wrap Card */}
          <MonthlyWrapCard stats={monthlyStats} />

          {/* Smart Promotion System */}
          <SmartPromotionBanner />

          {/* Subscription and Usage Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubscriptionStatusCard />
            <UsageLimitsCard />
          </div>

          {/* Admin Dashboard Card - Only for Admins */}
          {adminData?.isAdmin && <Card className="border border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer" onClick={() => navigate('/admin-dashboard')}>
              
            </Card>}

          {/* Quick Actions - Centered */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <SimpleQuickActions />
            </div>
          </div>
        </div>
      </UnifiedAdLayout>
      
      {/* App Guide */}
      {showGuide && <AppGuide onClose={handleCloseGuide} />}

      {/* Achievement Popup */}
      <AchievementPopup
        achievement={latestUnshared}
        open={showAchievementPopup}
        onClose={() => setShowAchievementPopup(false)}
      />

      {/* Quota Upgrade Dialog */}
      {limits && <QuotaUpgradeDialog {...quotaDialogProps} />}
      
      <div className="h-32" />
      <BottomNav />
    </div>;
});
Dashboard.displayName = 'Dashboard';
export default Dashboard;