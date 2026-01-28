import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useNavigate } from "react-router-dom";
import { Crown, Calendar, Clock, CreditCard, ExternalLink, Gem } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export const SubscriptionSettingsTab = () => {
  const { t, i18n } = useTranslation(['settings', 'dashboard']);
  const navigate = useNavigate();
  const { 
    subscription, 
    isTrialActive, 
    daysLeft, 
    rewardPointsBalance,
    loading
  } = useSubscription();
  const { currentPlan, badgeConfig } = usePlanBadge();

  const dateLocale = i18n.language === 'ar' ? ar : enUS;

  if (loading) {
    return (
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusText = () => {
    if (!subscription) return t('dashboard:subscription.no_subscription');
    
    if (subscription.status === 'trialing') {
      return isTrialActive ? t('dashboard:subscription.trialing_active') : t('dashboard:subscription.trialing_expired');
    }
    
    switch (subscription.status) {
      case 'active': return t('dashboard:subscription.active');
      case 'expired': return t('dashboard:subscription.expired');
      case 'canceled': return t('dashboard:subscription.canceled');
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
    if (!subscription) return t('dashboard:subscription.free_plan');
    
    switch (subscription.plan) {
      case 'personal': return t('dashboard:subscription.personal_plan');
      case 'family': return t('dashboard:subscription.family_plan');
      case 'lifetime': return t('dashboard:subscription.lifetime_plan');
      default: return subscription.plan;
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMMM yyyy', { locale: dateLocale });
  };

  const showExpiryInfo = subscription && (subscription.status === 'active' || subscription.status === 'trialing');
  const shouldShowUpgrade = currentPlan === 'free' || subscription?.status === 'expired' || subscription?.status === 'canceled';

  return (
    <div className="space-y-6">
      {/* الخطة الحالية */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Crown className="w-5 h-5 text-primary" />
                {t('settings:subscription.current_plan')}
              </CardTitle>
              <CardDescription>{t('settings:subscription.current_plan_desc', 'تفاصيل اشتراكك الحالي')}</CardDescription>
            </div>
            <Badge 
              className={`${badgeConfig.bgColor} ${badgeConfig.color} border-0 text-base px-4 py-1`}
            >
              {badgeConfig.badge} {badgeConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* معلومات الخطة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">{t('settings:subscription.plan_type', 'نوع الخطة')}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{getPlanLabel()}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{t('settings:subscription.status')}</span>
              </div>
              <Badge variant={getStatusVariant()} className="text-sm">
                {getStatusText()}
              </Badge>
            </div>
          </div>

          {/* تواريخ الاشتراك */}
          {subscription && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{t('settings:subscription.start_date', 'تاريخ البداية')}</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatDate(subscription.started_at)}
                  </p>
                </div>
                
                {showExpiryInfo && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{t('settings:subscription.end_date', 'تاريخ الانتهاء')}</span>
                    </div>
                    <p className={`text-lg font-semibold ${daysLeft <= 7 ? 'text-warning' : 'text-foreground'}`}>
                      {formatDate(subscription.expires_at)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* شريط التقدم */}
          {showExpiryInfo && daysLeft > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('settings:subscription.days_remaining', 'المدة المتبقية')}
                  </span>
                  <span className={`text-sm font-medium ${daysLeft <= 7 ? 'text-warning' : 'text-foreground'}`}>
                    {daysLeft} {t('dashboard:subscription.days')}
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(getProgressPercentage())}% {t('dashboard:subscription.of_period_used')}
                </p>
              </div>
            </>
          )}

          {/* نقاط المكافآت */}
          {rewardPointsBalance > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">{t('dashboard:subscription.reward_points')}</span>
                </div>
                <Button 
                  variant="link" 
                  className="text-primary font-bold text-lg"
                  onClick={() => navigate('/credit-store')}
                >
                  {rewardPointsBalance} {t('dashboard:subscription.points')}
                  <ExternalLink className="w-4 h-4 ms-1" />
                </Button>
              </div>
            </>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {shouldShowUpgrade && (
              <Button 
                onClick={() => navigate('/pricing')}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Crown className="w-4 h-4 me-2" />
                {t('settings:subscription.subscribe_now', 'اشترك الآن')}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="flex-1"
            >
              {t('settings:subscription.manage_subscription', 'إدارة الاشتراك')}
            </Button>
          </div>

          {/* تحذير انتهاء قريب */}
          {showExpiryInfo && daysLeft <= 7 && daysLeft > 0 && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning text-center">
                ⚠️ {t('settings:subscription.expiry_warning', { days: daysLeft, defaultValue: `اشتراكك سينتهي خلال ${daysLeft} أيام. جدد الآن للاستمرار بالميزات المميزة.` })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSettingsTab;
