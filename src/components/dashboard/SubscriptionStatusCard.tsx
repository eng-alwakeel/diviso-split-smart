import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useNavigate } from "react-router-dom";
import { Crown, Calendar, Gift, TrendingUp } from "lucide-react";

export const SubscriptionStatusCard = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { 
    subscription, 
    isTrialActive, 
    daysLeft, 
    totalDaysLeft, 
    freeDaysFromReferrals,
    loading
  } = useSubscription();
  const { currentPlan, badgeConfig } = usePlanBadge();
  const { currentPlan: planFromLimits } = useSubscriptionLimits();

  console.log('SubscriptionStatusCard: Rendering with:', {
    subscription,
    isTrialActive,
    daysLeft,
    totalDaysLeft,
    loading,
    freeDaysFromReferrals,
    currentPlan,
    planFromLimits
  });

  // Show loading state
  if (loading) {
    return (
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t('subscription.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-muted animate-pulse rounded"></div>
            <div className="h-6 bg-muted animate-pulse rounded"></div>
            <div className="h-8 bg-muted animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusText = () => {
    if (!subscription) return t('subscription.no_subscription');
    
    if (subscription.status === 'trialing') {
      return isTrialActive ? t('subscription.trialing_active') : t('subscription.trialing_expired');
    }
    
    switch (subscription.status) {
      case 'active': return t('subscription.active');
      case 'expired': return t('subscription.expired');
      case 'canceled': return t('subscription.canceled');
      default: return subscription.status;
    }
  };

  const getStatusVariant = (): "default" | "destructive" | "info" | "success" => {
    if (!subscription) return "default";
    
    if (subscription.status === 'trialing') {
      return isTrialActive ? "info" : "destructive";
    }
    
    switch (subscription.status) {
      case 'active': return "success";
      case 'expired': 
      case 'canceled': return "destructive";
      default: return "default";
    }
  };

  const getProgressPercentage = () => {
    if (!subscription || !isTrialActive) return 0;
    const totalTrialDays = 7;
    return ((totalTrialDays - daysLeft) / totalTrialDays) * 100;
  };

  const shouldShowUpgrade = currentPlan === 'free' || (subscription?.status === 'trialing' && daysLeft <= 2);

  return (
    <Card className="border border-border hover:shadow-sm transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t('subscription.title')}
          </CardTitle>
          <Badge 
            className={`${badgeConfig.bgColor} ${badgeConfig.color} border-0`}
          >
            {badgeConfig.badge} {badgeConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* حالة الاشتراك */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('subscription.status')}:</span>
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* الأيام المتبقية للتجربة */}
        {isTrialActive && daysLeft > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('subscription.trial_days_left')}:
              </span>
              <span className="text-sm font-medium text-foreground">
                {daysLeft} {t('subscription.days')}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        )}

        {/* الأيام المجانية من الإحالات */}
        {freeDaysFromReferrals > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Gift className="w-4 h-4" />
              {t('subscription.free_days_from_referrals')}:
            </span>
            <span className="text-sm font-medium text-success">
              {freeDaysFromReferrals} {t('subscription.days')}
            </span>
          </div>
        )}

        {/* إجمالي الأيام المتبقية */}
        {totalDaysLeft > 0 && (
          <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
            <span className="text-sm font-medium text-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {t('subscription.total_days_remaining')}:
            </span>
            <span className="text-sm font-bold text-primary">
              {totalDaysLeft} {t('subscription.days')}
            </span>
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className="flex gap-2 pt-2">
          {shouldShowUpgrade && (
            <Button 
              onClick={() => navigate('/pricing')}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="sm"
            >
              {t('subscription.upgrade')}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            size="sm"
            className="flex-1"
          >
            {t('subscription.manage_subscription')}
          </Button>
        </div>

        {/* تحذير انتهاء التجربة */}
        {isTrialActive && daysLeft <= 2 && daysLeft > 0 && (
          <Alert variant="warning" className="p-3">
            <AlertDescription className="text-xs text-center">
              ⚠️ {t('subscription.trial_warning', { days: daysLeft })}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};