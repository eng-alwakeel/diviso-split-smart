import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  Gift, 
  History, 
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Loader2,
  UserPlus,
  CheckCircle2,
  Circle,
  ArrowRight
} from 'lucide-react';
import { useUsageCredits } from '@/hooks/useUsageCredits';
import { useRewardPoints } from '@/hooks/useRewardPoints';
import { useDailyCredits } from '@/hooks/useDailyCredits';
import { useReferralStats } from '@/hooks/useReferralStats';
import { CreditPackagesGrid } from '@/components/credits/CreditPackagesGrid';
import { DailyCreditsCard } from '@/components/credits/DailyCreditsCard';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const CreditStore = React.memo(() => {
  const { t, i18n } = useTranslation(['credits', 'common']);
  const isRTL = i18n.language === 'ar';
  const dateLocale = isRTL ? ar : enUS;
  const navigate = useNavigate();

  const { balance, loading: creditsLoading, getConsumptionHistory } = useUsageCredits();
  const { summary, loading: rewardsLoading, converting, convertToCredits, getRewardHistory } = useRewardPoints();
  const { canClaim, dailyAmount } = useDailyCredits();
  const { totalEarnedFromReferrals, inviteesProgress, loading: referralLoading } = useReferralStats();

  const [consumptionHistory, setConsumptionHistory] = useState<any[]>([]);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pointsToConvert, setPointsToConvert] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      const [consumption, rewards] = await Promise.all([
        getConsumptionHistory(10),
        getRewardHistory(10)
      ]);
      setConsumptionHistory(consumption);
      setRewardHistory(rewards);
      setHistoryLoading(false);
    };
    loadHistory();
  }, [getConsumptionHistory, getRewardHistory]);

  const handleConvert = async () => {
    if (pointsToConvert >= 10) {
      await convertToCredits(pointsToConvert);
      setPointsToConvert(0);
    }
  };

  // Referral journey steps
  const referralJourneySteps = [
    { key: 'signup', points: 0, icon: UserPlus },
    { key: 'first_usage', points: 10, icon: CheckCircle2 },
    { key: 'group_settlement', points: 20, icon: CheckCircle2 },
  ];

  const bonusRewards = [
    { key: 'active_7_days', points: 5 },
    { key: 'subscribed', points: 20 },
  ];

  if (creditsLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('store.title')}</h1>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-2 gap-4">
          {/* Usage Credits */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <Coins className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold text-primary">
                {balance.totalAvailable}
              </div>
              <p className="text-sm text-primary/80">
                {t('balance.credits')}
              </p>
              {balance.expiringSoon > 0 && (
                <Badge variant="outline" className="mt-2 text-xs border-primary/30 text-primary">
                  {balance.expiringSoon} {t('balance.expiring_soon')}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Reward Points */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <Gift className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold text-primary">
                {summary.availableBalance}
              </div>
              <p className="text-sm text-primary/80">
                {t('rewards.balance')}
              </p>
              {summary.canConvert && summary.availableBalance >= 10 && (
                <Badge className="mt-2 text-xs bg-primary text-primary-foreground">
                  {t('rewards.convert')}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Credits */}
        <DailyCreditsCard />

        {/* Tabs */}
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buy" className="gap-1">
              <Coins className="h-4 w-4" />
              {t('store.buy_credits')}
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-1">
              <Gift className="h-4 w-4" />
              {t('rewards.title')}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="h-4 w-4" />
              {t('store.history')}
            </TabsTrigger>
          </TabsList>

          {/* Buy Credits Tab */}
          <TabsContent value="buy" className="mt-4">
            <CreditPackagesGrid />
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="mt-4 space-y-4">
            {/* Convert Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowLeftRight className="h-5 w-5" />
                  {t('rewards.convert')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('rewards.rate')}
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={summary.availableBalance}
                      step={10}
                      value={pointsToConvert}
                      onChange={(e) => setPointsToConvert(Number(e.target.value))}
                      className="w-full"
                      disabled={!summary.canConvert || summary.availableBalance < 10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>{summary.availableBalance}</span>
                    </div>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-2xl font-bold text-primary">{pointsToConvert}</div>
                    <div className="text-xs text-muted-foreground">{t('balance_card.reward_points')}</div>
                  </div>
                  <div className="text-muted-foreground">=</div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-2xl font-bold text-primary">{Math.floor(pointsToConvert / 10)}</div>
                    <div className="text-xs text-muted-foreground">{t('balance_card.usage_credits')}</div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={pointsToConvert < 10 || converting || !summary.canConvert}
                  onClick={handleConvert}
                >
                  {converting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                      {t('rewards.converting')}
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('rewards.convert')}
                    </>
                  )}
                </Button>

                {!summary.canConvert && summary.nextConversionAt && (
                  <p className="text-sm text-center text-muted-foreground">
                    <Clock className="h-4 w-4 inline ltr:mr-1 rtl:ml-1" />
                    {t('rewards.next_conversion', { 
                      hours: Math.ceil((summary.nextConversionAt.getTime() - Date.now()) / (1000 * 60 * 60))
                    })}
                  </p>
                )}

                {summary.availableBalance < 10 && (
                  <p className="text-sm text-center text-muted-foreground">
                    {t('rewards.min_convert')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Referral Journey */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" />
                  {t('referral_journey.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Journey Steps */}
                <div className="relative">
                  <div className="flex justify-between items-center">
                    {referralJourneySteps.map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <step.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs text-center text-muted-foreground">
                          {t(`referral_journey.step_${step.key === 'signup' ? 'signup' : step.key === 'first_usage' ? 'first_usage' : 'group_settlement'}`)}
                        </span>
                        <Badge variant="secondary" className="mt-1">
                          +{step.points}
                        </Badge>
                        {index < referralJourneySteps.length - 1 && (
                          <ArrowRight className="absolute top-4 text-muted-foreground h-4 w-4" style={{ left: `${((index + 1) / referralJourneySteps.length) * 100 - 16}%` }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Successful Referral */}
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {t('referral_journey.successful_referral')} = 30 {t('referral_journey.points')}
                  </p>
                </div>

                {/* Bonus Rewards */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">{t('referral_journey.bonus_rewards')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {bonusRewards.map((bonus) => (
                      <div key={bonus.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-sm">{t(`referral_journey.${bonus.key}`)}</span>
                        <Badge variant="secondary">+{bonus.points}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Max per Referral */}
                <div className="text-center p-2 rounded-lg bg-primary/5">
                  <span className="text-sm font-medium text-primary">
                    💎 {t('referral_journey.max_per_referral')} = 55 {t('referral_journey.points')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Invitee Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  {t('invitee_status.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Total Earned */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{t('invitee_status.total_earned')}</span>
                  <Badge className="bg-primary">{totalEarnedFromReferrals} {t('referral_journey.points')}</Badge>
                </div>

                {/* Invitees List */}
                {referralLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : inviteesProgress.length === 0 ? (
                  <div className="text-center py-6 space-y-3">
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">{t('invitee_status.no_invites')}</p>
                    <Button variant="outline" onClick={() => navigate('/referral-center')}>
                      {t('invitee_status.invite_now')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inviteesProgress.slice(0, 5).map((invitee) => (
                      <div key={invitee.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {invitee.stage === 'joined' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{invitee.name}</span>
                        </div>
                        <Badge variant={invitee.stage === 'joined' ? 'default' : 'secondary'}>
                          {t(`invitee_status.stages.${invitee.stage}`)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How to Earn */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  {t('how_to_earn.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Daily Streaks */}
                  <div>
                    <p className="text-sm font-medium mb-2">{t('how_to_earn.daily_streaks')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['streak_3', 'streak_7', 'streak_30'].map((streak) => (
                        <div key={streak} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-sm">{t(`rewards.sources.${streak}`)}</span>
                          <Badge variant="secondary">
                            +{streak === 'streak_3' ? 5 : streak === 'streak_7' ? 10 : 25}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Referral Rewards */}
                  <div>
                    <p className="text-sm font-medium mb-2">{t('how_to_earn.referral_rewards')}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: 'first_usage', points: 10 },
                        { key: 'group_settlement', points: 20 },
                        { key: 'active_7_days', points: 5 },
                        { key: 'subscribed', points: 20 },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-sm">{t(`referral_journey.${item.key === 'first_usage' ? 'step_first_usage' : item.key === 'group_settlement' ? 'step_group_settlement' : item.key}`)}</span>
                          <Badge variant="secondary">+{item.points}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 space-y-4">
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : consumptionHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('store.no_history')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {consumptionHistory.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {t(`actions.${item.action_type}`) || item.action_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'PPp', { locale: dateLocale })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-destructive">
                        -{item.amount_consumed}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="h-32" />
      <BottomNav />
    </div>
  );
});

CreditStore.displayName = 'CreditStore';
export default CreditStore;
