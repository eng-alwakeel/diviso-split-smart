import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Coins, 
  Gift, 
  History, 
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Loader2
} from 'lucide-react';
import { useUsageCredits } from '@/hooks/useUsageCredits';
import { useRewardPoints } from '@/hooks/useRewardPoints';
import { useDailyCredits } from '@/hooks/useDailyCredits';
import { CreditPackagesGrid } from '@/components/credits/CreditPackagesGrid';
import { DailyCreditsCard } from '@/components/credits/DailyCreditsCard';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const CreditStore = React.memo(() => {
  const { t, i18n } = useTranslation(['credits', 'common']);
  const isRTL = i18n.language === 'ar';
  const dateLocale = isRTL ? ar : enUS;

  const { balance, loading: creditsLoading, getConsumptionHistory } = useUsageCredits();
  const { summary, loading: rewardsLoading, converting, convertToCredits, getRewardHistory } = useRewardPoints();
  const { canClaim, dailyAmount } = useDailyCredits();

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
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Coins className="h-8 w-8 mx-auto text-amber-600 mb-2" />
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                {balance.totalAvailable}
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                {t('balance.credits')}
              </p>
              {balance.expiringSoon > 0 && (
                <Badge variant="outline" className="mt-2 text-xs border-amber-300 text-amber-700">
                  {balance.expiringSoon} {t('balance.expiring_soon')}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Reward Points */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <Gift className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                {summary.availableBalance}
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-500">
                {t('rewards.balance')}
              </p>
              {summary.canConvert && summary.availableBalance >= 10 && (
                <Badge className="mt-2 text-xs bg-purple-600">
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
                    <div className="text-2xl font-bold text-purple-600">{pointsToConvert}</div>
                    <div className="text-xs text-muted-foreground">نقطة مكافأة</div>
                  </div>
                  <div className="text-muted-foreground">=</div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-2xl font-bold text-amber-600">{Math.floor(pointsToConvert / 10)}</div>
                    <div className="text-xs text-muted-foreground">نقطة استخدام</div>
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

            {/* How to Earn */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  كيف تكسب نقاط المكافآت؟
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries({
                    daily_login: 2,
                    add_expense: 1,
                    create_group: 3,
                    settlement: 2,
                    referral_signup: 10,
                    referral_active: 20
                  }).map(([source, amount]) => (
                    <div key={source} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{t(`rewards.sources.${source}`)}</span>
                      <Badge variant="secondary">+{amount}</Badge>
                    </div>
                  ))}
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
