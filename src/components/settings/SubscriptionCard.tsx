import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const SubscriptionCard = memo(() => {
  const { t, i18n } = useTranslation(['settings', 'dashboard']);
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";
  
  const { 
    subscription, 
    isTrialActive, 
    daysLeft, 
    loading
  } = useSubscription();
  const { badgeConfig, isFreePlan } = usePlanBadge();
  const dateLocale = i18n.language === 'ar' ? ar : enUS;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusText = () => {
    if (!subscription) return isRTL ? "مجاني" : "Free";
    
    if (subscription.status === 'trialing') {
      return isTrialActive 
        ? (isRTL ? "تجريبي" : "Trial") 
        : (isRTL ? "منتهي" : "Expired");
    }
    
    switch (subscription.status) {
      case 'active': return isRTL ? "نشط" : "Active";
      case 'expired': return isRTL ? "منتهي" : "Expired";
      case 'canceled': return isRTL ? "ملغي" : "Canceled";
      default: return isRTL ? "غير محدد" : "Unknown";
    }
  };

  const getStatusVariant = (): "default" | "destructive" | "secondary" | "outline" => {
    if (!subscription) return "secondary";
    
    if (subscription.status === 'trialing') {
      return isTrialActive ? "default" : "destructive";
    }
    
    switch (subscription.status) {
      case 'active': return "default";
      case 'expired': 
      case 'canceled': return "destructive";
      default: return "secondary";
    }
  };

  const getPlanLabel = () => {
    if (!subscription || isFreePlan) return isRTL ? "مجاني" : "Free";
    
    const planBase = subscription.plan
      .replace('_monthly', '')
      .replace('_yearly', '')
      .toLowerCase();
    
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

  const hasActiveSubscription = subscription && 
    (subscription.status === 'active' || (subscription.status === 'trialing' && isTrialActive));

  const getProgressPercentage = () => {
    if (!subscription || !hasActiveSubscription) return 0;
    
    const startDate = new Date(subscription.started_at).getTime();
    const endDate = new Date(subscription.expires_at).getTime();
    const now = Date.now();
    
    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const shouldShowUpgrade = isFreePlan || subscription?.status === 'expired' || subscription?.status === 'canceled';

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-primary" />
            {isRTL ? "الخطة الحالية" : "Current Plan"}
          </CardTitle>
          <Badge 
            className={`${badgeConfig.bgColor} ${badgeConfig.color} border-0`}
          >
            {badgeConfig.badge} {getPlanLabel()}
          </Badge>
        </div>
        <CardDescription>
          {isRTL ? "إدارة اشتراكك وخطتك" : "Manage your subscription and plan"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Days Left */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{isRTL ? "الحالة" : "Status"}</span>
            </div>
            <Badge variant={getStatusVariant()} className="text-xs">
              {hasActiveSubscription && <CheckCircle2 className="w-3 h-3 me-1" />}
              {getStatusText()}
            </Badge>
          </div>
          
          {hasActiveSubscription && daysLeft > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">{isRTL ? "متبقي" : "Remaining"}</span>
              </div>
              <p className={`text-sm font-bold ${daysLeft <= 7 ? 'text-amber-500' : 'text-primary'}`}>
                {daysLeft} {isRTL ? "يوم" : "days"}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar for Active Subscriptions */}
        {hasActiveSubscription && daysLeft > 0 && (
          <div className="space-y-1.5">
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(getProgressPercentage())}% {isRTL ? "من الفترة" : "of period used"}
            </p>
          </div>
        )}

        {/* Expiry Warning */}
        {hasActiveSubscription && daysLeft <= 7 && daysLeft > 0 && (
          <div className="p-2 rounded-lg bg-amber-500/10 text-center">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ {isRTL ? `ينتهي خلال ${daysLeft} يوم` : `Expires in ${daysLeft} days`}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {shouldShowUpgrade ? (
            <Button 
              onClick={() => navigate('/pricing')}
              className="flex-1 gap-2"
              size="sm"
            >
              <Crown className="h-4 w-4" />
              {isRTL ? "اشترك الآن" : "Subscribe Now"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="flex-1"
              size="sm"
            >
              {isRTL ? "إدارة الاشتراك" : "Manage Subscription"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SubscriptionCard.displayName = "SubscriptionCard";

export default SubscriptionCard;
