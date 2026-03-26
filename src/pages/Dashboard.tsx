import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, Users, Receipt, Wallet, Plus, ArrowDown, ArrowUp, Activity, Gift, ChevronLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useOptimizedDashboardData } from "@/hooks/useOptimizedQueries";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useTranslation } from "react-i18next";
import { useFoundingUser } from "@/hooks/useFoundingUser";
import { UserNumberBadge } from "@/components/ui/user-number-badge";
import { RecentGroupActivityCard } from "@/components/dashboard/RecentGroupActivityCard";
import { useReferralStats } from "@/hooks/useReferralStats";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { useDashboardRealtimeListener } from "@/hooks/useUnifiedRealtimeListener";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useRecommendationTriggers } from "@/hooks/useRecommendationTriggers";
import { useRecommendations } from "@/hooks/useRecommendations";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useBrowserNotificationPrompt } from "@/hooks/useBrowserNotificationPrompt";
import { toast as sonnerToast } from "sonner";

// Lazy load dialogs
const AchievementPopup = lazy(() => import("@/components/achievements/AchievementPopup").then(m => ({ default: m.AchievementPopup })));
const RecommendationDialog = lazy(() => import("@/components/recommendations/RecommendationDialog").then(m => ({ default: m.RecommendationDialog })));
const SelectGroupDialog = lazy(() => import("@/components/recommendations/SelectGroupDialog").then(m => ({ default: m.SelectGroupDialog })));
const LocationPermissionDialog = lazy(() => import("@/components/LocationPermissionDialog").then(m => ({ default: m.LocationPermissionDialog })));
const NotificationPermissionDialog = lazy(() => import("@/components/NotificationPermissionDialog").then(m => ({ default: m.NotificationPermissionDialog })));
const RecommendationNotification = lazy(() => import("@/components/recommendations/RecommendationNotification").then(m => ({ default: m.RecommendationNotification })));

// --- Summary Stat Cell ---
const SummaryCell = React.memo(({ 
  icon: Icon, label, value, valueColor, onClick, emphasized 
}: { 
  icon: React.ElementType; label: string; value: string; valueColor?: string; onClick: () => void; emphasized?: boolean 
}) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center py-3 gap-0.5 rounded-xl hover:bg-muted/50 transition-colors"
  >
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <p className={cn(
      "leading-none",
      emphasized ? "text-xl font-black" : "text-lg font-bold",
      valueColor || "text-foreground"
    )}>
      {value}
    </p>
    <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
  </button>
));
SummaryCell.displayName = 'SummaryCell';

// --- Referral Strip ---
const ReferralStrip = React.memo(({ totalReferrals, totalEarned, onClick }: { 
  totalReferrals: number; totalEarned: number; onClick: () => void 
}) => {
  const { t } = useTranslation('dashboard');
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl border border-border/30 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Gift className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-foreground">
          {t('referral_strip.summary', { count: totalReferrals, points: totalEarned })}
        </p>
      </div>
      <span className="text-xs text-primary font-medium">{t('referral_strip.invite')}</span>
    </button>
  );
});
ReferralStrip.displayName = 'ReferralStrip';

const Dashboard = React.memo(() => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const { data: adminData } = useAdminAuth();
  const { enabled: onboardingV2Enabled } = useFeatureFlag('new_onboarding_v2');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [showSelectGroupDialog, setShowSelectGroupDialog] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [userId, setUserId] = useState<string>();

  // Referral stats
  const { totalReferrals, totalEarnedFromReferrals } = useReferralStats();

  // Location hook
  const { 
    city, requestLocation, dismissLocationRequest, shouldShowLocationPrompt, getFreshLocation 
  } = useUserLocation();

  // Browser notification prompt
  const {
    shouldShowPrompt: shouldShowNotificationPrompt,
    requestPermission: requestNotificationPermission,
    dismissPrompt: dismissNotificationPrompt,
  } = useBrowserNotificationPrompt();

  // Recommendation triggers
  const { 
    shouldShow: showRecommendation, triggerType, mealType,
    dismissTrigger, isEnabled: recommendationsEnabled
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
            <ToastAction altText={t("recommendations:view")} onClick={handleViewRecommendation}>
              {t("recommendations:view")}
            </ToastAction>
          ),
        });
      }
    }
  });

  // Recommendations hook
  const { 
    currentRecommendation, generateRecommendation, acceptRecommendation,
    dismissRecommendation, addAsExpense, completeAddAsExpense,
    pendingExpenseRecommendation, clearPendingExpense,
    isLoading: recommendationLoading 
  } = useRecommendations();

  const handleAddAsExpense = useCallback(async (recommendation: any) => {
    const result = await addAsExpense(recommendation);
    if (result?.needsGroupSelection) setShowSelectGroupDialog(true);
  }, [addAsExpense]);

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    };
    getUser();
  }, []);

  useDashboardRealtimeListener(userId || null);

  // Auto-complete install_app onboarding task when running as standalone PWA
  useEffect(() => {
    const checkStandaloneAndComplete = async () => {
      const isStandalone = (window.navigator as any).standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;
      if (!isStandalone) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        await supabase.rpc('complete_onboarding_task', { p_task_name: 'install_app', p_user_id: user.id });
      } catch (e) {
        console.error('[Dashboard] install_app task error:', e);
      }
    };
    checkStandaloneAndComplete();
  }, []);

  const dashboardMode = useDashboardMode(userId);
  const { userNumber, isFoundingUser } = useFoundingUser(userId);

  const {
    data: dashboardData, isLoading: loading, error, refetch
  } = useOptimizedDashboardData(userId);

  const myPaid = dashboardData?.myPaid ?? 0;
  const myOwed = dashboardData?.myOwed ?? 0;
  const monthlyTotalExpenses = dashboardData?.monthlyTotalExpenses ?? 0;
  const groupsCount = dashboardData?.groupsCount ?? 0;
  const netBalance = myPaid - myOwed;
  const currencySymbol = t('dashboard:stats.currency');

  // Real-time listener for group members changes
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('dashboard-group-members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refetch]);

  // Show location dialog for first-time users
  useEffect(() => {
    if (userId && shouldShowLocationPrompt()) {
      const timer = setTimeout(() => setShowLocationDialog(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [userId, shouldShowLocationPrompt]);

  // Show notification dialog after location dialog closes
  useEffect(() => {
    if (userId && !showLocationDialog && shouldShowNotificationPrompt()) {
      const timer = setTimeout(() => setShowNotificationDialog(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [userId, showLocationDialog, shouldShowNotificationPrompt]);

  const handleViewRecommendation = useCallback(async () => {
    if (!recommendationsEnabled) return;
    setShowRecommendationDialog(true);
    const { city: freshCity, district: freshDistrict, coords } = await getFreshLocation();
    const result = await generateRecommendation({
      trigger: triggerType === "meal_time" ? "meal_time" : "post_expense",
      city: freshCity, district: freshDistrict || undefined,
      latitude: coords?.latitude, longitude: coords?.longitude,
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

  const handleLocationAllow = useCallback(async () => {
    const success = await requestLocation();
    setShowLocationDialog(false);
    return success;
  }, [requestLocation]);

  const handleLocationDismiss = useCallback(() => {
    dismissLocationRequest();
    setShowLocationDialog(false);
  }, [dismissLocationRequest]);

  const handleNotificationAllow = useCallback(async () => {
    const success = await requestNotificationPermission();
    setShowNotificationDialog(false);
    if (success) sonnerToast.success(t("notifications:permission.enabled_success"));
    return success;
  }, [requestNotificationPermission, t]);

  const handleNotificationDismiss = useCallback(() => {
    dismissNotificationPrompt();
    setShowNotificationDialog(false);
  }, [dismissNotificationPrompt]);

  const handleRetry = useCallback(() => refetch(), [refetch]);

  // Redirect new users to onboarding v2
  useEffect(() => {
    if (
      !loading && !dashboardMode.isLoading && onboardingV2Enabled &&
      (groupsCount === 0 || (dashboardMode.completedCount === 0 && !dashboardMode.rewardClaimed))
    ) {
      navigate('/onboarding', { replace: true });
    }
  }, [loading, dashboardMode.isLoading, onboardingV2Enabled, groupsCount, navigate]);

  if (loading || dashboardMode.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
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
            <h2 className="text-xl font-semibold text-foreground">{t('dashboard:error.title')}</h2>
            <p className="text-muted-foreground text-center">{error?.message || t('dashboard:error.unexpected')}</p>
            <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 ml-2" />
              {t('dashboard:error.retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={t('dashboard:welcome')} noIndex={true} />
      <AppHeader />
      
      <div className="page-container space-y-4">
        {/* Welcome Section */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{t('dashboard:welcome')}</h1>
            <p className="text-muted-foreground text-sm">{t('dashboard:subtitle')}</p>
          </div>
          {userNumber && (
            <UserNumberBadge userNumber={userNumber} isFoundingUser={isFoundingUser} size="md" />
          )}
        </div>

        {/* Section 1: Summary Grid — 2 rows × 3 columns */}
        <div className="rounded-xl border border-border/50 bg-card p-2">
          {/* Row 1: Balance → Owed → Receivable */}
          <div className="grid grid-cols-3 gap-1">
            <SummaryCell
              icon={Wallet}
              label={t('dashboard:stats.net_balance')}
              value={`${netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString()}`}
              valueColor={netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}
              onClick={() => navigate('/my-expenses')}
            />
            <SummaryCell
              icon={ArrowDown}
              label={t('dashboard:stats.owed')}
              value={`${myOwed.toLocaleString()}`}
              valueColor="text-destructive"
              onClick={() => navigate('/my-expenses/payables')}
              emphasized
            />
            <SummaryCell
              icon={ArrowUp}
              label={t('dashboard:stats.receivable')}
              value={`${myPaid.toLocaleString()}`}
              valueColor="text-green-600 dark:text-green-400"
              onClick={() => navigate('/my-expenses/receivables')}
              emphasized
            />
          </div>
          
          {/* Divider */}
          <div className="border-t border-border/30 mx-2 my-1" />
          
          {/* Row 2: Groups → Monthly Expenses → Activity */}
          <div className="grid grid-cols-3 gap-1">
            <SummaryCell
              icon={Users}
              label={t('dashboard:stats.groups')}
              value={groupsCount.toLocaleString()}
              onClick={() => navigate('/my-groups')}
            />
            <SummaryCell
              icon={Receipt}
              label={t('dashboard:stats.monthly_expenses')}
              value={`${monthlyTotalExpenses.toLocaleString()}`}
              onClick={() => navigate('/my-expenses')}
            />
            <SummaryCell
              icon={Activity}
              label={t('dashboard:stats.active')}
              value={groupsCount.toLocaleString()}
              onClick={() => navigate('/my-groups')}
            />
          </div>
        </div>

        {/* Section 2: Quick Actions */}
        <div className="flex gap-3">
          <Button className="flex-1 gap-2 h-12" onClick={() => navigate('/create-group')}>
            <Users className="w-4 h-4" />
            {t('dashboard:quick_actions.create_group')}
          </Button>
          <Button variant="outline" className="flex-1 gap-2 h-12" onClick={() => navigate('/add-expense')}>
            <Plus className="w-4 h-4" />
            {t('dashboard:quick_actions.add_expense')}
          </Button>
        </div>

        {/* Section 3: Referral Strip — hidden if no groups */}
        {groupsCount > 0 && (
          <ReferralStrip
            totalReferrals={totalReferrals}
            totalEarned={totalEarnedFromReferrals}
            onClick={() => navigate('/referral')}
          />
        )}

        {/* Section 4: Recent Activity — hidden if no groups */}
        {groupsCount > 0 && dashboardMode.hubData?.last_group_event && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('dashboard:recent_activity.label')}</p>
            <RecentGroupActivityCard lastGroupEvent={dashboardMode.hubData.last_group_event} />
          </div>
        )}

        {/* Empty State */}
        {groupsCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Users className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">{t('dashboard:empty_state.title')}</p>
            <Button onClick={() => navigate('/create-group')} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('dashboard:empty_state.cta')}
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Suspense fallback={null}>
        <LocationPermissionDialog
          open={showLocationDialog}
          onAllow={handleLocationAllow}
          onDismiss={handleLocationDismiss}
        />
      </Suspense>

      <Suspense fallback={null}>
        <NotificationPermissionDialog
          open={showNotificationDialog}
          onAllow={handleNotificationAllow}
          onDismiss={handleNotificationDismiss}
        />
      </Suspense>

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

      <Suspense fallback={null}>
        <AchievementPopup
          achievement={null}
          open={showAchievementPopup}
          onClose={() => setShowAchievementPopup(false)}
        />
      </Suspense>

      <div className="h-32" />
      <BottomNav />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
