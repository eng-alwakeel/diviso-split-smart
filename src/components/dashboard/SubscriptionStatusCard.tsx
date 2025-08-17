import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useNavigate } from "react-router-dom";
import { Crown, Calendar, Gift, TrendingUp } from "lucide-react";

export const SubscriptionStatusCard = () => {
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
            حالة الاشتراك
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
    if (!subscription) return "لا يوجد اشتراك";
    
    if (subscription.status === 'trialing') {
      return isTrialActive ? "تجريبي نشط" : "تجريبي منتهي";
    }
    
    switch (subscription.status) {
      case 'active': return "نشط";
      case 'expired': return "منتهي";
      case 'canceled': return "ملغي";
      default: return subscription.status;
    }
  };

  const getStatusColor = () => {
    if (!subscription) return "bg-muted";
    
    if (subscription.status === 'trialing') {
      return isTrialActive ? "bg-blue-50 dark:bg-blue-950" : "bg-red-50 dark:bg-red-950";
    }
    
    switch (subscription.status) {
      case 'active': return "bg-green-50 dark:bg-green-950";
      case 'expired': 
      case 'canceled': return "bg-red-50 dark:bg-red-950";
      default: return "bg-muted";
    }
  };

  const getProgressPercentage = () => {
    if (!subscription || !isTrialActive) return 0;
    const totalTrialDays = 7; // الافتراض أن التجربة 7 أيام
    return ((totalTrialDays - daysLeft) / totalTrialDays) * 100;
  };

  const shouldShowUpgrade = currentPlan === 'free' || (subscription?.status === 'trialing' && daysLeft <= 2);

  return (
    <Card className="border border-border hover:shadow-sm transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            حالة الاشتراك
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
          <span className="text-sm text-muted-foreground">الحالة:</span>
          <Badge className={`${getStatusColor()} text-foreground border-0`}>
            {getStatusText()}
          </Badge>
        </div>

        {/* الأيام المتبقية للتجربة */}
        {isTrialActive && daysLeft > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                أيام التجربة المتبقية:
              </span>
              <span className="text-sm font-medium text-foreground">
                {daysLeft} يوم
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
              أيام مجانية من الإحالات:
            </span>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {freeDaysFromReferrals} يوم
            </span>
          </div>
        )}

        {/* إجمالي الأيام المتبقية */}
        {totalDaysLeft > 0 && (
          <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
            <span className="text-sm font-medium text-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              إجمالي الأيام المتبقية:
            </span>
            <span className="text-sm font-bold text-primary">
              {totalDaysLeft} يوم
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
              ترقية الباقة
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            size="sm"
            className="flex-1"
          >
            إدارة الاشتراك
          </Button>
        </div>

        {/* تحذير انتهاء التجربة */}
        {isTrialActive && daysLeft <= 2 && daysLeft > 0 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-xs text-orange-700 dark:text-orange-300 text-center">
              ⚠️ ستنتهي فترة التجربة خلال {daysLeft} يوم. قم بالترقية للاستمرار في استخدام جميع الميزات.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};