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
import { Crown, Calendar, Clock, CreditCard, ExternalLink, Gem, CheckCircle2 } from "lucide-react";
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
  const { currentPlan, badgeConfig, isFreePlan } = usePlanBadge();

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
    if (!subscription) return t('settings:status.unknown');
    
    if (subscription.status === 'trialing') {
      return isTrialActive ? t('settings:status.trialing') : t('settings:status.expired');
    }
    
    switch (subscription.status) {
      case 'active': return t('settings:status.active');
      case 'expired': return t('settings:status.expired');
      case 'canceled': return t('settings:status.canceled');
      default: return t('settings:status.unknown');
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
    if (!subscription || isFreePlan) return t('settings:plans.free');
    
    // استخراج اسم الخطة الأساسي
    const planBase = subscription.plan
      .replace('_monthly', '')
      .replace('_yearly', '')
      .toLowerCase();
    
    // خريطة للتوافق مع الخطط القديمة والجديدة
    const planMap: Record<string, string> = {
      'starter': 'Starter',
      'pro': 'Pro',
      'max': 'Max',
      'personal': 'Starter',
      'family': 'Pro',
      'lifetime': 'Max',
    };
    
    return planMap[planBase] || subscription.plan;
  };

  const getBillingCycle = () => {
    if (!subscription) return null;
    const isYearly = subscription.plan.includes('_yearly') || subscription.plan.includes('yearly');
    return isYearly ? t('dashboard:subscription.yearly') : t('dashboard:subscription.monthly');
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMMM yyyy', { locale: dateLocale });
  };

  const showExpiryInfo = subscription && (subscription.status === 'active' || subscription.status === 'trialing');
  const shouldShowUpgrade = isFreePlan || subscription?.status === 'expired' || subscription?.status === 'canceled';
  const hasActiveSubscription = subscription && (subscription.status === 'active' || (subscription.status === 'trialing' && isTrialActive));

  return (
    <div className="space-y-6">
      {/* الخطة الحالية */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Crown className="w-5 h-5 text-primary" />
                {t('settings:subscription.current_plan')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('settings:subscription.current_plan_desc')}
              </CardDescription>
            </div>
            <Badge 
              className={`${badgeConfig.bgColor} ${badgeConfig.color} border-0 text-base px-4 py-2 font-bold shadow-sm`}
            >
              {badgeConfig.badge} {badgeConfig.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* معلومات الخطة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">{t('settings:subscription.plan_type')}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-foreground">{getPlanLabel()}</p>
                {getBillingCycle() && hasActiveSubscription && (
                  <Badge variant="outline" className="text-xs">
                    {getBillingCycle()}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{t('settings:subscription.status')}</span>
              </div>
              <Badge variant={getStatusVariant()} className="text-sm px-3 py-1">
                {hasActiveSubscription && <CheckCircle2 className="w-3 h-3 me-1" />}
                {getStatusText()}
              </Badge>
            </div>
          </div>

          {/* تواريخ الاشتراك */}
          {subscription && hasActiveSubscription && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('settings:subscription.start_date')}</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatDate(subscription.started_at)}
                  </p>
                </div>
                
                {showExpiryInfo && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('settings:subscription.end_date')}</span>
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
              <Separator className="my-4" />
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('settings:subscription.days_remaining')}
                  </span>
                  <span className={`text-lg font-bold ${daysLeft <= 7 ? 'text-warning' : 'text-primary'}`}>
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
              <Separator className="my-4" />
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">{t('dashboard:subscription.reward_points')}</span>
                </div>
                <Button 
                  variant="link" 
                  className="text-primary font-bold text-lg p-0"
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
                className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base"
              >
                <Crown className="w-5 h-5 me-2" />
                {t('settings:subscription.subscribe_now')}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="flex-1 h-12 text-base"
            >
              {t('settings:subscription.manage_subscription')}
            </Button>
          </div>

          {/* تحذير انتهاء قريب */}
          {showExpiryInfo && daysLeft <= 7 && daysLeft > 0 && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
              <p className="text-sm text-warning text-center font-medium">
                ⚠️ {t('settings:subscription.expiry_warning', { days: daysLeft })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSettingsTab;
