import React, { useState, useCallback, useEffect } from "react";
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
import { SmartPromotionBanner } from "@/components/promotions/SmartPromotionBanner";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { Card } from "@/components/ui/card";
import { SimpleStatsGrid } from "@/components/dashboard/SimpleStatsGrid";
import { SimpleQuickActions } from "@/components/dashboard/SimpleQuickActions";
import { FixedStatsAdBanner } from "@/components/ads/FixedStatsAdBanner";
import DailyCheckInCard from "@/components/dashboard/DailyCheckInCard";
import { OnboardingProgress } from "@/components/dashboard/OnboardingProgress";

import { CreditBalanceCard } from "@/components/credits/CreditBalanceCard";
import { useTranslation } from "react-i18next";
import { useAchievements } from "@/hooks/useAchievements";
import { ShareableAchievementCard } from "@/components/achievements/ShareableAchievementCard";
import { AchievementPopup } from "@/components/achievements/AchievementPopup";
import { MonthlyWrapCard } from "@/components/achievements/MonthlyWrapCard";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardRealtimeListener } from "@/hooks/useUnifiedRealtimeListener";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useRecommendationTriggers } from "@/hooks/useRecommendationTriggers";
import { useRecommendations } from "@/hooks/useRecommendations";
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog";
import { RecommendationNotification } from "@/components/recommendations/RecommendationNotification";
import { RecommendationDialog } from "@/components/recommendations/RecommendationDialog";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { FloatingSupportButton } from "@/components/support/FloatingSupportButton";
import { useDivisoCoins } from "@/hooks/useDivisoCoins";

const Dashboard = React.memo(() => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [userId, setUserId] = useState<string>();
  
  // Location hook
  const { 
    city, 
    requestLocation, 
    dismissLocationRequest, 
    shouldShowLocationPrompt 
  } = useUserLocation();

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
      // Show interactive toast when recommendation triggers
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
    isLoading: recommendationLoading 
  } = useRecommendations();
  
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

  // Show location dialog for first-time users
  useEffect(() => {
    if (userId && shouldShowLocationPrompt()) {
      // Delay showing the dialog to not overwhelm new users
      const timer = setTimeout(() => {
        setShowLocationDialog(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userId, shouldShowLocationPrompt]);

  // Handle viewing a recommendation
  const handleViewRecommendation = useCallback(async () => {
    if (!recommendationsEnabled) return;
    
    // Open dialog first
    setShowRecommendationDialog(true);
    
    // Generate a recommendation based on current context
    await generateRecommendation({
      trigger: triggerType === "meal_time" ? "meal_time" : "post_expense",
      city,
    });
  }, [recommendationsEnabled, generateRecommendation, triggerType, city]);

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

  // Memoized callbacks for better performance
  const handleShowGuide = useCallback(() => setShowGuide(true), []);
  const handleCloseGuide = useCallback(() => setShowGuide(false), []);
  const handleRetry = useCallback(() => refetch(), [refetch]);
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
      <SEO title={t('dashboard:welcome')} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="dashboard"
        showTopBanner={false}
        showBottomBanner={false}
      >
        <div className="page-container space-y-6">
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

          {/* Onboarding Progress Card - Priority for new users */}
          <OnboardingProgress />

          {/* Stats Grid - Main focus after onboarding */}
          <SimpleStatsGrid monthlyTotalExpenses={monthlyTotalExpenses} groupsCount={groupsCount} weeklyExpensesCount={weeklyExpensesCount} myPaid={myPaid} myOwed={myOwed} />

          {/* Daily Check-in Card */}
          <DailyCheckInCard />


          {/* Credit Balance Card */}
          <CreditBalanceCard />

          {/* Fixed Ad Banner Below Stats */}
          <FixedStatsAdBanner placement="dashboard_stats" />

          {/* Latest Unshared Achievement */}
          {latestUnshared && (
            <ShareableAchievementCard achievement={latestUnshared} compact />
          )}

          {/* Monthly Wrap Card */}
          <MonthlyWrapCard stats={monthlyStats} onShare={handleWrapShare} />

          {/* Smart Promotion System */}
          <SmartPromotionBanner />

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

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onAllow={handleLocationAllow}
        onDismiss={handleLocationDismiss}
      />

      {/* Recommendation Notification */}
      {showRecommendation && recommendationsEnabled && (
        <RecommendationNotification
          type={mealType === "lunch" ? "lunch" : mealType === "dinner" ? "dinner" : "post_expense"}
          placeName={currentRecommendation?.name}
          onViewRecommendation={handleViewRecommendation}
          onDismiss={dismissTrigger}
        />
      )}

      {/* Recommendation Dialog */}
      <RecommendationDialog
        open={showRecommendationDialog}
        onOpenChange={setShowRecommendationDialog}
        recommendation={currentRecommendation}
        onAddAsExpense={addAsExpense}
        onOpenLocation={(rec) => {
          if (rec.location?.lat && rec.location?.lng) {
            window.open(`https://www.google.com/maps?q=${rec.location.lat},${rec.location.lng}`, "_blank");
          } else if (rec.affiliate_url) {
            window.open(rec.affiliate_url, "_blank");
          }
        }}
        onDismiss={(id) => {
          dismissRecommendation(id);
          setShowRecommendationDialog(false);
        }}
        isLoading={recommendationLoading}
      />

      {/* Achievement Popup */}
      <AchievementPopup
        achievement={latestUnshared}
        open={showAchievementPopup}
        onClose={() => setShowAchievementPopup(false)}
      />

      {/* Floating Support Button */}
      <FloatingSupportButton />

      <div className="h-32" />
      <BottomNav />
    </div>;
});
Dashboard.displayName = 'Dashboard';
export default Dashboard;