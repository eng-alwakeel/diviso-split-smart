import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AppGuide } from "@/components/AppGuide";
import { useOptimizedDashboardData } from "@/hooks/useOptimizedQueries";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { Card } from "@/components/ui/card";
import { OnboardingProgress } from "@/components/dashboard/OnboardingProgress";
import { InstallWidget } from "@/components/pwa/InstallWidget";
import { DailyFocusCard } from "@/components/dashboard/DailyFocusCard";
import { HomePlanCard } from "@/components/dashboard/HomePlanCard";
import { MinimalQuickActions } from "@/components/dashboard/MinimalQuickActions";
import { StatsLiteCard } from "@/components/dashboard/StatsLiteCard";
import { BalanceStatusCard } from "@/components/dashboard/BalanceStatusCard";
import { RecentGroupActivityCard } from "@/components/dashboard/RecentGroupActivityCard";
import { StreakDisplay } from "@/components/daily-hub/StreakDisplay";
import { DailyDiceCard } from "@/components/daily-hub/DailyDiceCard";
import { useDashboardMode } from "@/hooks/useDashboardMode";

import { useTranslation } from "react-i18next";
import { useAchievements } from "@/hooks/useAchievements";
import { useFoundingUser } from "@/hooks/useFoundingUser";
import { UserNumberBadge } from "@/components/ui/user-number-badge";

// Lazy load heavy components for better initial load
const DailyRewardCardCompact = lazy(() => import("@/components/dashboard/DailyRewardCardCompact").then(m => ({ default: m.DailyRewardCardCompact })));
const CreditBalanceCard = lazy(() => import("@/components/credits/CreditBalanceCard").then(m => ({ default: m.CreditBalanceCard })));
const ShareableAchievementCard = lazy(() => import("@/components/achievements/ShareableAchievementCard").then(m => ({ default: m.ShareableAchievementCard })));
const AchievementPopup = lazy(() => import("@/components/achievements/AchievementPopup").then(m => ({ default: m.AchievementPopup })));
const MonthlyWrapCard = lazy(() => import("@/components/achievements/MonthlyWrapCard").then(m => ({ default: m.MonthlyWrapCard })));
const SmartPromotionBanner = lazy(() => import("@/components/promotions/SmartPromotionBanner").then(m => ({ default: m.SmartPromotionBanner })));
const RecommendationDialog = lazy(() => import("@/components/recommendations/RecommendationDialog").then(m => ({ default: m.RecommendationDialog })));
const SelectGroupDialog = lazy(() => import("@/components/recommendations/SelectGroupDialog").then(m => ({ default: m.SelectGroupDialog })));
const LocationPermissionDialog = lazy(() => import("@/components/LocationPermissionDialog").then(m => ({ default: m.LocationPermissionDialog })));
const NotificationPermissionDialog = lazy(() => import("@/components/NotificationPermissionDialog").then(m => ({ default: m.NotificationPermissionDialog })));
const RecommendationNotification = lazy(() => import("@/components/recommendations/RecommendationNotification").then(m => ({ default: m.RecommendationNotification })));

// Fallback for lazy components
const CardSkeleton = () => <Skeleton className="h-24 w-full rounded-lg" />;
import { supabase } from "@/integrations/supabase/client";
import { useDashboardRealtimeListener } from "@/hooks/useUnifiedRealtimeListener";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useRecommendationTriggers } from "@/hooks/useRecommendationTriggers";
import { useRecommendations } from "@/hooks/useRecommendations";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { FloatingSupportButton } from "@/components/support/FloatingSupportButton";
import { useDivisoCoins } from "@/hooks/useDivisoCoins";
import { useBrowserNotificationPrompt } from "@/hooks/useBrowserNotificationPrompt";
import { toast as sonnerToast } from "sonner";

const Dashboard = React.memo(() => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [showSelectGroupDialog, setShowSelectGroupDialog] = useState(false);
  const [userId, setUserId] = useState<string>();
  
  // Location hook
  const { 
    city, 
    requestLocation, 
    dismissLocationRequest, 
    shouldShowLocationPrompt,
    getFreshLocation 
  } = useUserLocation();

  // Browser notification prompt hook
  const {
    shouldShowPrompt: shouldShowNotificationPrompt,
    requestPermission: requestNotificationPermission,
    dismissPrompt: dismissNotificationPrompt,
  } = useBrowserNotificationPrompt();

  // Recommendation triggers
  const { 
    shouldShow: showRecommendation,
    triggerType,
    mealType,
    dismissTrigger,
    isEnabled: recommendationsEnabled
  } = useRecommendationTriggers({
    city,
    onTrigger: (trigger) => {
      if (trigger.shouldShow) {
        toast({
          title: trigger.mealType === "lunch" 
            ? t("recommendations:notifications.lunch_time")
            : trigger.mealType === "dinner"
            ? t("recommendations:notifications.dinner_time")
            : t("recommendations:notifications.default_title"),
          description: t("recommendations:notifications.find_place"),
          action: (
            <ToastAction 
              altText={t("recommendations:view")} 
              onClick={() => {
                handleViewRecommendation();
              }}
            >
              {t("recommendations:view")}
            </ToastAction>
          ),
        });
      }
    }
  });

  // Recommendations hook
  const { 
    currentRecommendation, 
    generateRecommendation, 
    acceptRecommendation, 
    dismissRecommendation,
    addAsExpense,
    completeAddAsExpense,
    pendingExpenseRecommendation,
    clearPendingExpense,
    isLoading: recommendationLoading 
  } = useRecommendations();

  // Handle add as expense
  const handleAddAsExpense = useCallback(async (recommendation: any) => {
    const result = await addAsExpense(recommendation);
    if (result?.needsGroupSelection) {
      setShowSelectGroupDialog(true);
    }
  }, [addAsExpense]);
  
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

  // Use unified real-time listener
  useDashboardRealtimeListener(userId || null);

  // Dashboard mode hook
  const dashboardMode = useDashboardMode(userId);
  
  // Achievements hook
  const { latestUnshared, unsharedCount, monthlyStats } = useAchievements();
  
  // Founding user hook
  const { userNumber, isFoundingUser } = useFoundingUser(userId);
  
  // Coins hook
  const { addCoins } = useDivisoCoins();
  
  // Handle monthly wrap share
  const handleWrapShare = useCallback(async () => {
    await addCoins(1, 'monthly_wrap_share', 'مشاركة الملخص الشهري');
  }, [addCoins]);
  
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
  const netBalance = myPaid - myOwed;

  // Real-time listener for group members changes
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('dashboard-group-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members'
        },
        () => {
          refetch();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  // Show location dialog for first-time users
  useEffect(() => {
    if (userId && shouldShowLocationPrompt()) {
      const timer = setTimeout(() => {
        setShowLocationDialog(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userId, shouldShowLocationPrompt]);

  // Show notification dialog after location dialog closes
  useEffect(() => {
    if (userId && !showLocationDialog && shouldShowNotificationPrompt()) {
      const timer = setTimeout(() => {
        setShowNotificationDialog(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userId, showLocationDialog, shouldShowNotificationPrompt]);

  // Handle viewing a recommendation
  const handleViewRecommendation = useCallback(async () => {
    if (!recommendationsEnabled) return;
    
    setShowRecommendationDialog(true);
    
    const { city: freshCity, district: freshDistrict, coords } = await getFreshLocation();
    
    const result = await generateRecommendation({
      trigger: triggerType === "meal_time" ? "meal_time" : "post_expense",
      city: freshCity,
      district: freshDistrict || undefined,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
    
    if (!result) {
      setShowRecommendationDialog(false);
      dismissTrigger();
      toast({
        title: t("recommendations:errors.no_recommendation_now"),
        description: t("recommendations:errors.try_again_later"),
      });
    }
  }, [recommendationsEnabled, generateRecommendation, triggerType, getFreshLocation, dismissTrigger, t]);

  // Handle location permission
  const handleLocationAllow = useCallback(async () => {
    const success = await requestLocation();
    setShowLocationDialog(false);
    return success;
  }, [requestLocation]);

  const handleLocationDismiss = useCallback(() => {
    dismissLocationRequest();
    setShowLocationDialog(false);
  }, [dismissLocationRequest]);

  // Handle notification permission
  const handleNotificationAllow = useCallback(async () => {
    const success = await requestNotificationPermission();
    setShowNotificationDialog(false);
    if (success) {
      sonnerToast.success(t("notifications:permission.enabled_success"));
    }
    return success;
  }, [requestNotificationPermission, t]);

  const handleNotificationDismiss = useCallback(() => {
    dismissNotificationPrompt();
    setShowNotificationDialog(false);
  }, [dismissNotificationPrompt]);

  // Memoized callbacks
  const handleShowGuide = useCallback(() => setShowGuide(true), []);
  const handleCloseGuide = useCallback(() => setShowGuide(false), []);
  const handleRetry = useCallback(() => refetch(), [refetch]);

  if (loading || dashboardMode.isLoading) {
    return <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
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

  const { mode } = dashboardMode;
  const diceType = dashboardMode.hubData?.dice_of_the_day || dashboardMode.hubData?.suggested_dice_type || null;

  return <div className="min-h-screen bg-background">
      <SEO title={t('dashboard:welcome')} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="dashboard"
        showTopBanner={false}
        showBottomBanner={false}
      >
        <div className="page-container space-y-4">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">{t('dashboard:welcome')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard:subtitle')}</p>
              </div>
              {userNumber && (
                <UserNumberBadge 
                  userNumber={userNumber} 
                  isFoundingUser={isFoundingUser} 
                  size="md"
                />
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleShowGuide} className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-4 h-4 ml-2" />
              {t('dashboard:help')}
            </Button>
          </div>

          {/* ===== ONBOARDING MODE ===== */}
          {dashboardMode.showOnboardingChecklist && (
            <OnboardingProgress />
          )}

          {/* Daily Focus Card (always shown) */}
          <DailyFocusCard
            mode={mode}
            sessionHint={dashboardMode.sessionHint}
            lastActionHint={dashboardMode.lastActionHint}
            nextTask={dashboardMode.nextIncompleteTask}
            activePlan={dashboardMode.activePlan}
            netBalance={netBalance}
            daysSinceLastAction={dashboardMode.daysSinceLastAction}
          />

          {/* Streak Display (daily_hub & reengagement) */}
          {mode !== 'onboarding' && dashboardMode.streakCount > 0 && (
            <StreakDisplay count={dashboardMode.streakCount} />
          )}

          {/* Daily Dice (shown per showDice flag) */}
          {dashboardMode.showDice && (
            <DailyDiceCard
              suggestedType={diceType}
              lockedDate={dashboardMode.hubData?.dice_locked_at}
            />
          )}

          {/* Minimal Quick Actions (daily_hub + reengagement) */}
          {mode !== 'onboarding' && (
            <MinimalQuickActions />
          )}
          {/* HomePlanCard (always visible) */}
          <HomePlanCard
            activePlan={dashboardMode.activePlan}
            mode={mode}
          />

          {/* Stats Lite Card (daily_hub + reengagement) */}
          {dashboardMode.showStatsLite && (
            <StatsLiteCard
              monthlyTotalExpenses={monthlyTotalExpenses}
              netBalance={netBalance}
              groupsCount={groupsCount}
              outstandingAmount={Math.max(0, myOwed - myPaid)}
            />
          )}

          {/* Balance Status Card (daily_hub + reengagement) */}
          {dashboardMode.showBalanceCard && (
            <BalanceStatusCard netBalance={netBalance} />
          )}

          {/* Daily Reward Card Compact (daily_hub + reengagement) */}
          {dashboardMode.showDailyRewardCard && (
            <Suspense fallback={<CardSkeleton />}>
              <DailyRewardCardCompact />
            </Suspense>
          )}

          {/* Recent Group Activity (daily_hub only) */}
          {dashboardMode.showRecentActivity && (
            <RecentGroupActivityCard
              lastGroupEvent={dashboardMode.hubData?.last_group_event ?? null}
            />
          )}

          {/* Daily Hub extras */}
          {mode === 'daily_hub' && (
            <>
              <Suspense fallback={<CardSkeleton />}>
                <CreditBalanceCard />
              </Suspense>

              {latestUnshared && (
                <Suspense fallback={<CardSkeleton />}>
                  <ShareableAchievementCard achievement={latestUnshared} compact />
                </Suspense>
              )}

              <Suspense fallback={<CardSkeleton />}>
                <MonthlyWrapCard stats={monthlyStats} onShare={handleWrapShare} />
              </Suspense>

              <Suspense fallback={<CardSkeleton />}>
                <SmartPromotionBanner />
              </Suspense>
            </>
          )}

          {/* PWA Install (always) */}
          <InstallWidget where="appHome" />

          {/* Admin Dashboard Card - Only for Admins */}
          {adminData?.isAdmin && <Card className="border border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer" onClick={() => navigate('/admin-dashboard')}>
            </Card>}
        </div>
      </UnifiedAdLayout>
      
      {/* App Guide */}
      {showGuide && <AppGuide onClose={handleCloseGuide} />}

      {/* Location Permission Dialog */}
      <Suspense fallback={null}>
        <LocationPermissionDialog
          open={showLocationDialog}
          onAllow={handleLocationAllow}
          onDismiss={handleLocationDismiss}
        />
      </Suspense>

      {/* Browser Notification Permission Dialog */}
      <Suspense fallback={null}>
        <NotificationPermissionDialog
          open={showNotificationDialog}
          onAllow={handleNotificationAllow}
          onDismiss={handleNotificationDismiss}
        />
      </Suspense>

      {/* Recommendation Notification */}
      {showRecommendation && recommendationsEnabled && (
        <Suspense fallback={null}>
          <RecommendationNotification
            type={mealType === "lunch" ? "lunch" : mealType === "dinner" ? "dinner" : "post_expense"}
            placeName={currentRecommendation?.name}
            onViewRecommendation={handleViewRecommendation}
            onDismiss={dismissTrigger}
          />
        </Suspense>
      )}

      {/* Recommendation Dialog */}
      <Suspense fallback={null}>
        <RecommendationDialog
          open={showRecommendationDialog}
          onOpenChange={setShowRecommendationDialog}
          recommendation={currentRecommendation}
          onAddAsExpense={handleAddAsExpense}
          onOpenLocation={(rec) => {
            if (rec.location?.lat && rec.location?.lng) {
              window.open(`https://www.google.com/maps?q=${rec.location.lat},${rec.location.lng}`, "_blank");
            } else if (rec.affiliate_url) {
              window.open(rec.affiliate_url, "_blank");
            } else {
              window.open(`https://www.google.com/maps/search/${encodeURIComponent(rec.name)}`, "_blank");
            }
          }}
          onDismiss={(id) => {
            dismissRecommendation(id);
            setShowRecommendationDialog(false);
          }}
          isLoading={recommendationLoading}
        />
      </Suspense>

      {/* Select Group Dialog */}
      <Suspense fallback={null}>
        <SelectGroupDialog
          open={showSelectGroupDialog}
          onOpenChange={(open) => {
            setShowSelectGroupDialog(open);
            if (!open) clearPendingExpense();
          }}
          onSelect={(groupId) => {
            completeAddAsExpense(groupId);
            setShowRecommendationDialog(false);
          }}
        />
      </Suspense>

      {/* Achievement Popup */}
      <Suspense fallback={null}>
        <AchievementPopup
          achievement={latestUnshared}
          open={showAchievementPopup}
          onClose={() => setShowAchievementPopup(false)}
        />
      </Suspense>

      {/* Floating Support Button */}
      <FloatingSupportButton />

      <div className="h-32" />
      <BottomNav />
    </div>;
});
Dashboard.displayName = 'Dashboard';
export default Dashboard;
