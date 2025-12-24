import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, Calendar, Clock, Gift, Zap, Crown, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { QuotaStatus } from "@/components/QuotaStatus";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SubscriptionTabProps {
  subscription: any;
  isTrialActive: boolean;
  daysLeft: number;
  totalDaysLeft: number;
  remainingTrialDays: number;
  canStartTrial: boolean;
  canSwitchPlan: boolean;
  freeDaysFromReferrals: number;
  loading: boolean;
  handleStartTrial: (plan: 'personal' | 'family') => Promise<void>;
  handleSwitchPlan: (plan: 'personal' | 'family') => Promise<void>;
  handleCancelSubscription?: () => Promise<void>;
  getPlanDisplayName: (plan: string) => string;
  getStatusDisplayName: (status: string) => string;
}

export function SubscriptionTab({
  subscription,
  isTrialActive,
  daysLeft,
  totalDaysLeft,
  remainingTrialDays,
  canStartTrial,
  canSwitchPlan,
  freeDaysFromReferrals,
  loading,
  handleStartTrial,
  handleSwitchPlan,
  handleCancelSubscription,
  getPlanDisplayName,
  getStatusDisplayName
}: SubscriptionTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation(['common', 'settings']);
  const [cancelLoading, setCancelLoading] = useState(false);

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: i18n.language === 'ar' ? ar : enUS });
  };

  const onCancelSubscription = async () => {
    if (!handleCancelSubscription) return;
    
    setCancelLoading(true);
    try {
      await handleCancelSubscription();
      toast({
        title: t('settings:toast.subscription_canceled'),
        description: t('settings:toast.subscription_canceled_desc'),
      });
    } catch (error) {
      toast({
        title: t('common:error'),
        description: t('settings:toast.cancel_error'),
        variant: "destructive"
      });
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="w-5 h-5 text-accent" />
            {t('settings:subscription.title')}
          </CardTitle>
          <CardDescription>{t('settings:subscription.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">{t('settings:subscription.loading')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('settings:subscription.current_plan')}</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-accent text-accent">
                      {subscription?.plan ? getPlanDisplayName(subscription.plan) : t('settings:plans.free')}
                    </Badge>
                    {isTrialActive && (
                      <Badge variant="outline" className="border-primary text-primary">
                        {t('settings:status.trialing')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('settings:subscription.status')}</label>
                  <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                    {subscription?.status ? getStatusDisplayName(subscription.status) : t('settings:status.unknown')}
                  </Badge>
                </div>

                {subscription && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('settings:subscription.start_date')}
                      </label>
                      <p className="text-muted-foreground">
                        {formatDate(subscription.started_at)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {t('settings:subscription.end_date')}
                      </label>
                      <p className="text-muted-foreground">
                        {formatDate(subscription.expires_at)}
                      </p>
                    </div>
                  </>
                )}

                {subscription && daysLeft > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t('settings:subscription.days_remaining')}</label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-accent">{t('settings:subscription.days_count', { count: daysLeft })}</p>
                        <span className="text-sm text-muted-foreground">
                          {t('settings:subscription.total_days', { count: Math.ceil((new Date(subscription.expires_at).getTime() - new Date(subscription.started_at).getTime()) / (1000 * 60 * 60 * 24)) })}
                        </span>
                      </div>
                      <Progress value={(daysLeft / 30) * 100} className="h-2" />
                    </div>
                  </div>
                )}
              </div>

              <QuotaStatus />

              {/* Trial Days Remaining Display */}
              {remainingTrialDays > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-600" />
                    {t('settings:subscription.trial_days_remaining')}
                  </label>
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-700 dark:text-green-300">{t('settings:subscription.unified_trial')}</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400">
                        {t('settings:subscription.trial_days_count', { remaining: remainingTrialDays, total: 7 })}
                      </Badge>
                    </div>
                    <Progress value={(remainingTrialDays / 7) * 100} className="h-2 mb-2" />
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {t('settings:subscription.switch_during_trial')}
                    </p>
                  </div>
                </div>
              )}

              {!subscription?.plan || subscription?.plan === 'free' ? (
                canStartTrial ? (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('settings:subscription.start_trial_title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border border-border/50 hover:border-accent/50 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="w-4 h-4 text-accent" />
                            {t('settings:subscription.personal_plan')}
                          </CardTitle>
                          <CardDescription>{t('settings:subscription.personal_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => handleStartTrial('personal')}
                            className="w-full"
                            variant="outline"
                          >
                            <Calendar className="w-4 h-4 me-2" />
                            {t('settings:subscription.free_trial_7_days')}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border border-border/50 hover:border-accent/50 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Crown className="w-4 h-4 text-accent" />
                            {t('settings:subscription.family_plan')}
                          </CardTitle>
                          <CardDescription>{t('settings:subscription.family_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => handleStartTrial('family')}
                            className="w-full"
                            variant="outline"
                          >
                            <Calendar className="w-4 h-4 me-2" />
                            {t('settings:subscription.free_trial_7_days')}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-800 dark:text-amber-400">{t('settings:subscription.trial_expired_title')}</span>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        {t('settings:subscription.trial_expired_desc')}
                      </p>
                      <Button 
                        onClick={() => navigate('/pricing')}
                        className="w-full"
                        variant="default"
                      >
                        {t('settings:subscription.subscribe_now')}
                      </Button>
                    </div>
                  </div>
                )
              ) : canSwitchPlan ? (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('settings:subscription.switch_plan_title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscription.plan !== 'personal' && (
                      <Card className="border border-border/50 hover:border-accent/50 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="w-4 h-4 text-accent" />
                            {t('settings:subscription.personal_plan')}
                          </CardTitle>
                          <CardDescription>{t('settings:subscription.personal_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => handleSwitchPlan('personal')}
                            className="w-full"
                            variant="outline"
                          >
                            {t('settings:subscription.switch_to_personal')}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {subscription.plan !== 'family' && (
                      <Card className="border border-border/50 hover:border-accent/50 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Crown className="w-4 h-4 text-accent" />
                            {t('settings:subscription.family_plan')}
                          </CardTitle>
                          <CardDescription>{t('settings:subscription.family_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => handleSwitchPlan('family')}
                            className="w-full"
                            variant="outline"
                          >
                            {t('settings:subscription.switch_to_family')}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-border space-y-3">
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="w-full"
                  >
                    {t('settings:subscription.manage_subscription')}
                  </Button>
                  
                  {/* Cancel Subscription Button */}
                  {subscription && subscription.status !== 'canceled' && subscription.status !== 'expired' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline"
                          className="w-full border-destructive text-destructive hover:bg-destructive/10"
                          disabled={cancelLoading}
                        >
                          <XCircle className="w-4 h-4 me-2" />
                          {t('settings:subscription.cancel_subscription')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('settings:subscription.cancel_confirm_title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('settings:subscription.cancel_confirm_desc')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('settings:security.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={onCancelSubscription}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {cancelLoading ? t('settings:subscription.canceling') : t('settings:subscription.confirm_cancel')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {freeDaysFromReferrals > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 shadow-card rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
              <Gift className="w-5 h-5" />
              {t('settings:subscription.referral_days_title')}
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              {t('settings:subscription.referral_days_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800 dark:text-green-400">{t('settings:subscription.available_days')}</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400 border-green-300 dark:border-green-700">
                  {freeDaysFromReferrals} {t('settings:subscription.days_unit')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800 dark:text-green-400">{t('settings:subscription.total_remaining_days')}</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400 border-green-300 dark:border-green-700">
                  {totalDaysLeft} {t('settings:subscription.days_unit')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
