import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, HelpCircle, Shield } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AppGuide } from "@/components/AppGuide";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useFoundingUser } from "@/hooks/useFoundingUser";
import { SmartPromotionBanner } from "@/components/promotions/SmartPromotionBanner";
import { UserNumberBadge } from "@/components/ui/user-number-badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SmartAdManager } from "@/components/ads/SmartAdManager";
import { SmartAdSidebar } from "@/components/ads/SmartAdSidebar";

import { Card, CardContent } from "@/components/ui/card";
import { SimpleStatsGrid } from "@/components/dashboard/SimpleStatsGrid";
import { SimpleQuickActions } from "@/components/dashboard/SimpleQuickActions";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { UsageLimitsCard } from "@/components/dashboard/UsageLimitsCard";
import { QuotaWarningBanner } from "@/components/quota/QuotaWarningBanner";
import { QuotaUpgradeDialog } from "@/components/quota/QuotaUpgradeDialog";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

// Memoized loading skeleton for better performance
const LoadingSkeleton = React.memo(() => (
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
));

// Memoized error component
const ErrorDisplay = React.memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-background">
    <AppHeader />
    <div className="page-container">
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">حدث خطأ</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={onRetry} className="bg-primary hover:bg-primary/90">
          <RefreshCw className="w-4 h-4 ml-2" />
          إعادة المحاولة
        </Button>
      </div>
    </div>
  </div>
));

// Memoized admin card component
const AdminCard = React.memo(() => {
  const navigate = useNavigate();
  
  const handleAdminClick = useCallback(() => {
    navigate('/admin-dashboard');
  }, [navigate]);

  return (
    <Card 
      className="border border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer" 
      onClick={handleAdminClick}
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
  );
});

// Memoized quota warnings component
const QuotaWarnings = React.memo(({ 
  limits, 
  isFreePlan, 
  groupsCount, 
  weeklyExpensesCount, 
  checkQuotaWarning 
}: {
  limits: any;
  isFreePlan: boolean;
  groupsCount: number;
  weeklyExpensesCount: number;
  checkQuotaWarning: any;
}) => {
  const quotaWarnings = useMemo(() => {
    if (!limits || !isFreePlan) return [];
    
    return [
      { type: 'groups', usage: groupsCount || 0, limit: limits.groups },
      { type: 'expenses', usage: weeklyExpensesCount || 0, limit: limits.expenses },
    ].map(({ type, usage, limit }) => ({
      type,
      usage,
      limit,
      ...checkQuotaWarning(usage, limit, type)
    })).filter(warning => warning.showWarning || warning.showCritical);
  }, [limits, isFreePlan, groupsCount, weeklyExpensesCount, checkQuotaWarning]);

  if (quotaWarnings.length === 0) return null;

  return (
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
  );
});

const OptimizedDashboard = React.memo(() => {
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const [showGuide, setShowGuide] = useState(false);
  
  // Get current user ID for founding user badge - using getSession for faster local cache access
  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    },
    staleTime: Infinity, // User ID doesn't change during session
    gcTime: Infinity,
  });
  
  const { userNumber, isFoundingUser } = useFoundingUser(userId ?? undefined);
  
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

  // Memoized callbacks
  const handleShowGuide = useCallback(() => setShowGuide(true), []);
  const handleCloseGuide = useCallback(() => setShowGuide(false), []);
  const handleRetry = useCallback(() => refetch(), [refetch]);

  // Memoized quota dialog props
  const quotaDialogProps = useMemo(() => ({
    open: upgradeDialogOpen,
    onOpenChange: setUpgradeDialogOpen,
    quotaType: currentQuotaType,
    currentUsage: currentQuotaType === 'groups' ? (groupsCount || 0) :
                 currentQuotaType === 'expenses' ? (weeklyExpensesCount || 0) : 0,
    limit: currentQuotaType === 'groups' ? limits?.groups :
           currentQuotaType === 'expenses' ? limits?.expenses : 0
  }), [
    upgradeDialogOpen, 
    setUpgradeDialogOpen, 
    currentQuotaType, 
    groupsCount, 
    weeklyExpensesCount, 
    limits
  ]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="page-container space-y-6">
        {/* Quota Warning Banners */}
        <QuotaWarnings
          limits={limits}
          isFreePlan={isFreePlan}
          groupsCount={groupsCount || 0}
          weeklyExpensesCount={weeklyExpensesCount || 0}
          checkQuotaWarning={checkQuotaWarning}
        />

        {/* Smart Promotion System */}
        <SmartPromotionBanner />

        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">مرحباً بك!</h1>
              <p className="text-muted-foreground text-sm">إدارة ذكية للمصاريف المشتركة</p>
            </div>
            {userNumber && (
              <UserNumberBadge 
                userNumber={userNumber} 
                isFoundingUser={isFoundingUser} 
                size="md"
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowGuide}
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
          <SmartAdSidebar />
        </div>
        
        {/* Smart Contextual Ads */}
        <SmartAdManager
          context={{ type: 'dashboard' }}
          placement="dashboard_main"
          className="mt-4"
        />
        

        {/* Admin Dashboard Card - Only for Admins */}
        {adminData?.isAdmin && <AdminCard />}

        {/* Quick Actions - Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <SimpleQuickActions />
          </div>
        </div>
      </div>
      
      {/* App Guide */}
      {showGuide && <AppGuide onClose={handleCloseGuide} />}

      {/* Quota Upgrade Dialog */}
      {limits && (
        <QuotaUpgradeDialog {...quotaDialogProps} />
      )}
      
      <div className="h-24" />
      <BottomNav />
    </div>
  );
});

OptimizedDashboard.displayName = 'OptimizedDashboard';

export default OptimizedDashboard;