import React, { useState, useEffect } from 'react';
import { SEO } from "@/components/SEO";
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useUsageCredits } from '@/hooks/useUsageCredits';
import { useRewardPoints } from '@/hooks/useRewardPoints';
import { useReferralStats } from '@/hooks/useReferralStats';
import { CreditPackagesGrid } from '@/components/credits/CreditPackagesGrid';
import { SubscriptionPlansGrid } from '@/components/credits/SubscriptionPlansGrid';
import DailyCheckInCard from '@/components/dashboard/DailyCheckInCard';
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
  const { summary, loading: rewardsLoading, converting, convertToCredits } = useRewardPoints();
  const { totalEarnedFromReferrals, inviteesProgress, loading: referralLoading } = useReferralStats();

  const [consumptionHistory, setConsumptionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pointsToConvert, setPointsToConvert] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      const consumption = await getConsumptionHistory(10);
      setConsumptionHistory(consumption);
      setHistoryLoading(false);
    };
    loadHistory();
  }, [getConsumptionHistory]);

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
        <div className="px-4 pt-4 pb-28 max-w-7xl mx-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO title={t('store.title')} noIndex={true} />
      <AppHeader />
      
      <main className="px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-xl font-bold text-foreground">{t('store.title')}</h1>
        </div>

        {/* Balance Cards - Responsive: 1 col on mobile, 2 cols on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Usage Credits Card */}
          <Card className="bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border-primary/20 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{t('balance_card.usage_credits')}</p>
                  <p className="text-2xl font-bold text-primary">{balance.totalAvailable}</p>
                  {balance.expiringSoon > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{balance.expiringSoon} {t('balance.expiring_soon')}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reward Points Card */}
          <Card className="bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/20 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="h-6 w-6 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{t('balance_card.reward_points')}</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.availableBalance}</p>
                  {summary.canConvert && summary.availableBalance >= 10 && (
                    <Badge className="mt-1 text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                      {t('rewards.convert')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Credits */}
        <DailyCheckInCard />

        {/* Main Tabs */}
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-muted/50 p-1">
            <TabsTrigger 
              value="buy" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 text-sm h-full"
            >
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'شراء' : 'Buy'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 text-sm h-full"
            >
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'مكافآت' : 'Rewards'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 text-sm h-full"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'سجل' : 'History'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Buy Credits Tab */}
          <TabsContent value="buy" className="mt-4 space-y-8">
            {/* Subscriptions Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{t('subscriptions.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t('subscriptions.subtitle')}</p>
              <SubscriptionPlansGrid />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground font-medium px-2">
                {isRTL ? 'أو اشترِ باقة نقاط' : 'Or buy credit packages'}
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Credit Packages Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{t('packages.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t('packages.section_subtitle')}</p>
              <CreditPackagesGrid />
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="mt-4 space-y-4">
            {/* Convert Section */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  {t('rewards.convert')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('rewards.rate')}
                </p>
                
                {/* Conversion UI */}
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={summary.availableBalance}
                    step={10}
                    value={pointsToConvert}
                    onChange={(e) => setPointsToConvert(Number(e.target.value))}
                    className="w-full h-2 accent-primary rounded-full"
                    disabled={!summary.canConvert || summary.availableBalance < 10}
                  />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{pointsToConvert}</div>
                      <div className="text-xs text-muted-foreground">{t('balance_card.reward_points')}</div>
                    </div>
                    <div className="text-xl text-muted-foreground">=</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{Math.floor(pointsToConvert / 10)}</div>
                      <div className="text-xs text-muted-foreground">{t('balance_card.usage_credits')}</div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full h-11" 
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
                  <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
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

            {/* Referral Stats */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('invitee_status.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Total Earned */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10">
                  <span className="font-medium text-sm">{t('invitee_status.total_earned')}</span>
                  <Badge className="bg-primary text-primary-foreground text-sm">
                    {totalEarnedFromReferrals} {isRTL ? 'نقطة' : 'pts'}
                  </Badge>
                </div>

                {/* Invitees List */}
                {referralLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : inviteesProgress.length === 0 ? (
                  <div className="text-center py-4 space-y-3">
                    <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t('invitee_status.no_invites')}</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/referral')}>
                      {t('invitee_status.invite_now')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inviteesProgress.slice(0, 3).map((invitee) => (
                      <div key={invitee.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-card">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {invitee.stage === 'joined' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">{invitee.name}</span>
                        </div>
                        <Badge variant={invitee.stage === 'joined' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                          {t(`invitee_status.stages.${invitee.stage}`)}
                        </Badge>
                      </div>
                    ))}
                    {inviteesProgress.length > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm"
                        onClick={() => navigate('/referral')}
                      >
                        {t('common:view_all')} ({inviteesProgress.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invite CTA */}
            <Button 
              className="w-full h-11" 
              variant="outline"
              onClick={() => navigate('/referral')}
            >
              <UserPlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('invitee_status.invite_now')}
            </Button>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 space-y-3">
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : consumptionHistory.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('store.no_history')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {consumptionHistory.map((item) => (
                  <Card key={item.id} className="overflow-hidden rounded-xl">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <Coins className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {t(`actions.${item.action_type}`) || item.action_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'PP', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-destructive border-destructive/30 flex-shrink-0">
                        -{item.amount_consumed}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
});

CreditStore.displayName = 'CreditStore';
export default CreditStore;
