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
import { Crown, Calendar, Gem, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export const SubscriptionStatusCard = () => {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { 
    subscription, 
    isTrialActive, 
    daysLeft, 
    totalDaysLeft, 
    rewardPointsBalance,
    loading
  } = useSubscription();
  const { currentPlan, badgeConfig } = usePlanBadge();
  const { currentPlan: planFromLimits } = useSubscriptionLimits();

  const dateLocale = i18n.language === 'ar' ? ar : enUS;

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
    if (!subscription) return 0;
    
    // For active subscriptions, calculate based on subscription period
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      const startDate = new Date(subscription.started_at).getTime();
      const endDate = new Date(subscription.expires_at).getTime();
      const now = Date.now();
      
      const totalDuration = endDate - startDate;
      const elapsed = now - startDate;
      
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
    
    return 0;
  };

  const getPlanLabel = () => {
    if (!subscription) return t('subscription.free_plan');
    
    switch (subscription.plan) {
      case 'personal': return t('subscription.personal_plan');
      case 'family': return t('subscription.family_plan');
      case 'lifetime': return t('subscription.lifetime_plan');
      default: return subscription.plan;
    }
  };

  const getExpiryDate = () => {
    if (!subscription?.expires_at) return null;
    return format(new Date(subscription.expires_at), 'dd MMMM yyyy', { locale: dateLocale });
  };

  const shouldShowUpgrade = currentPlan === 'free' || (subscription?.status === 'trialing' && daysLeft <= 2);
  const isActiveSubscription = subscription?.status === 'active';
  const showExpiryInfo = subscription && (subscription.status === 'active' || subscription.status === 'trialing');

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
        {/* نوع الخطة */}
        {subscription && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('subscription.plan_type')}:</span>
            <span className="text-sm font-medium text-foreground">{getPlanLabel()}</span>
          </div>
        )}

        {/* حالة الاشتراك */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('subscription.status')}:</span>
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* تاريخ انتهاء الاشتراك */}
        {showExpiryInfo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {t('subscription.expires_on')}:
            </span>
            <span className="text-sm font-medium text-foreground">
              {getExpiryDate()}
            </span>
          </div>
        )}

        {/* الأيام المتبقية */}
        {showExpiryInfo && daysLeft > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {t('subscription.days_remaining')}:
              </span>
              <span className={`text-sm font-medium ${daysLeft <= 7 ? 'text-warning' : 'text-foreground'}`}>
                {daysLeft} {t('subscription.days')}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(getProgressPercentage())}% {t('subscription.of_period_used')}
            </p>
          </div>
        )}

        {/* نقاط المكافآت */}
        {rewardPointsBalance > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Gem className="w-4 h-4" />
              {t('subscription.reward_points')}:
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="text-sm font-medium text-primary p-0 h-auto"
              onClick={() => navigate('/credit-store')}
            >
              {rewardPointsBalance} {t('subscription.points')}
            </Button>
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

        {/* تحذير انتهاء الاشتراك */}
        {showExpiryInfo && daysLeft <= 7 && daysLeft > 0 && (
          <Alert variant="warning" className="p-3">
            <AlertDescription className="text-xs text-center">
              ⚠️ {t('subscription.expiry_warning', { days: daysLeft })}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};