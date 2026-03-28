import React, { memo, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AppGuide } from "@/components/AppGuide";
import { useOptimizedDashboardData, useOptimizedSubscriptionData } from "@/hooks/useOptimizedQueries";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card } from "@/components/ui/card";
import { SimpleStatsGrid } from "@/components/dashboard/SimpleStatsGrid";
import { SimpleQuickActions } from "@/components/dashboard/SimpleQuickActions";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { UsageLimitsCard } from "@/components/dashboard/UsageLimitsCard";
import { QuotaWarningBanner } from "@/components/quota/QuotaWarningBanner";
import { QuotaUpgradeDialog } from "@/components/quota/QuotaUpgradeDialog";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useHomeMode } from "@/hooks/useHomeMode";
import { getHomeModeUIConfig, DEFAULT_UI_CONFIG } from "@/services/homeModeEngine/uiModeConfig";
import { HOME_MODES, OVERLAYS } from "@/services/homeModeEngine/constants";
import { HomeModeHero } from "@/components/dashboard/HomeModeHero";
import { InvitePriorityCard } from "@/components/dashboard/InvitePriorityCard";
import { ModeContentSection } from "@/components/dashboard/ModeContentSection";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

// Lazy load heavy components
const LazySmartPromotionBanner = React.lazy(() => 
  import("@/components/promotions/SmartPromotionBanner").then(module => ({
    default: module.SmartPromotionBanner
  }))
);

const LazySmartAdManager = React.lazy(() => 
  import("@/components/ads/SmartAdManager").then(module => ({
    default: module.SmartAdManager
  }))
);

const LazySmartAdSidebar = React.lazy(() => 
  import("@/components/ads/SmartAdSidebar").then(module => ({
    default: module.SmartAdSidebar
  }))
);

const ComponentFallback = memo(() => (
  <div className="h-16 bg-card rounded-lg animate-pulse" />
));

const OptimizedDashboard = memo(() => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  // Home mode engine
  const { result: homeModeResult, isLoading: homeModeLoading } = useHomeMode();

  // UI config from resolved mode (fallback to creator_active)
  const uiConfig = useMemo(() => {
    if (!homeModeResult) return DEFAULT_UI_CONFIG;
    return getHomeModeUIConfig(homeModeResult.current_home_mode);
  }, [homeModeResult]);

  const isCreatorActive = homeModeResult?.current_home_mode === HOME_MODES.CREATOR_ACTIVE;
  const hasInviteOverlay = homeModeResult?.active_overlays?.includes(OVERLAYS.INVITE_PRIORITY) ?? false;

  // Data fetching
  const { data: dashboardData, isLoading, error, refetch } = useOptimizedDashboardData(userId);
  const { data: subscriptionData } = useOptimizedSubscriptionData(userId);
  const { data: adminData } = useAdminAuth();

  const { checkQuotaWarning, upgradeDialogOpen, setUpgradeDialogOpen, currentQuotaType, isFreePlan } = useQuotaHandler();
  const { limits } = useSubscriptionLimits();

  const callbacks = useMemo(() => ({
    handleShowGuide: () => setShowGuide(true),
    handleCloseGuide: () => setShowGuide(false),
    handleRetry: () => refetch(),
    navigateToAdmin: () => navigate('/admin-dashboard'),
  }), [refetch, navigate]);

  const quotaWarnings = useMemo(() => {
    if (!limits || !isFreePlan || !dashboardData) return [];
    return [
      { type: 'groups' as const, usage: dashboardData.groupsCount, limit: limits.groups },
      { type: 'expenses' as const, usage: dashboardData.weeklyExpensesCount, limit: limits.expenses },
    ]
      .map(({ type, usage, limit }) => ({ type, usage, limit, ...checkQuotaWarning(usage, limit, type) }))
      .filter(w => w.showWarning || w.showCritical);
  }, [limits, isFreePlan, dashboardData, checkQuotaWarning]);

  const componentProps = useMemo(() => ({
    quotaDialog: {
      open: upgradeDialogOpen,
      onOpenChange: setUpgradeDialogOpen,
      quotaType: currentQuotaType,
      currentUsage: currentQuotaType === 'groups' 
        ? dashboardData?.groupsCount || 0 
        : dashboardData?.weeklyExpensesCount || 0,
      limit: currentQuotaType === 'groups' ? limits?.groups : limits?.expenses
    },
    statsGrid: dashboardData ? {
      monthlyTotalExpenses: dashboardData.monthlyTotalExpenses,
      groupsCount: dashboardData.groupsCount,
      activeGroupsCount: dashboardData.activeGroupsCount ?? 0,
      weeklyExpensesCount: dashboardData.weeklyExpensesCount,
      myPaid: dashboardData.myPaid,
      myOwed: dashboardData.myOwed
    } : null
  }), [upgradeDialogOpen, setUpgradeDialogOpen, currentQuotaType, dashboardData, limits]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">حدث خطأ</h2>
            <p className="text-muted-foreground text-center">
              {error instanceof Error ? error.message : 'فشل في تحميل البيانات'}
            </p>
            <Button onClick={callbacks.handleRetry} className="bg-primary hover:bg-primary/90">
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
                type={warning.type}
                quotaType={warning.type}
                currentUsage={warning.usage} 
                limit={warning.limit} 
                percentage={warning.percentage} 
              />
            ))}
          </div>
        )}

        {/* Lazy loaded promotions — only for creator_active */}
        {uiConfig.showAds && (
          <Suspense fallback={<ComponentFallback />}>
            <LazySmartPromotionBanner />
          </Suspense>
        )}

        {/* Mode-Aware Hero Section */}
        <HomeModeHero 
          config={uiConfig} 
          onShowGuide={callbacks.handleShowGuide}
          isCreatorActive={isCreatorActive || !homeModeResult}
        />

        {/* Invite Priority Overlay */}
        {hasInviteOverlay && <InvitePriorityCard userId={userId} />}

        {/* Stats Grid — conditionally shown based on mode */}
        {uiConfig.showStatsGrid && componentProps.statsGrid && (
          <SimpleStatsGrid {...componentProps.statsGrid} />
        )}

        {/* Mode-specific content section (non-creator modes) */}
        {uiConfig.mainSectionType !== 'managed_groups' && (
          <ModeContentSection sectionType={uiConfig.mainSectionType} />
        )}

        {/* Creator-active: existing dashboard cards */}
        {uiConfig.mainSectionType === 'managed_groups' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SubscriptionStatusCard />
              <UsageLimitsCard />
              {uiConfig.showAds && (
                <Suspense fallback={<ComponentFallback />}>
                  <LazySmartAdSidebar />
                </Suspense>
              )}
            </div>
            
            {uiConfig.showAds && (
              <Suspense fallback={<ComponentFallback />}>
                <LazySmartAdManager
                  context={{ type: 'dashboard' }}
                  placement="dashboard_main"
                  className="mt-4"
                />
              </Suspense>
            )}
          </>
        )}

        {/* Admin Dashboard Card */}
        {adminData?.isAdmin && (
          <Card 
            className="border border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer" 
            onClick={callbacks.navigateToAdmin}
          />
        )}

        {/* Quick Actions — conditionally shown */}
        {uiConfig.showQuickActions && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <SimpleQuickActions />
            </div>
          </div>
        )}
      </div>
      
      {showGuide && <AppGuide onClose={callbacks.handleCloseGuide} />}
      {limits && <QuotaUpgradeDialog {...componentProps.quotaDialog} />}
      
      <div className="h-24" />
      <BottomNav />
    </div>
  );
});

OptimizedDashboard.displayName = 'OptimizedDashboard';
export default OptimizedDashboard;
