import React, { useState, useEffect } from 'react';
import { SEO } from "@/components/SEO";
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
  Loader2,
  UserPlus,
  CheckCircle2,
  Circle,
  AlertCircle,
  ShoppingCart
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
  const { summary, loading: rewardsLoading, converting, convertToCredits, getRewardHistory } = useRewardPoints();
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
        <div className="page-container space-y-4 px-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO title={t('store.title')} noIndex={true} />
      <AppHeader />
      
      <div className="page-container px-4 pb-32 space-y-5">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-xl font-bold text-foreground">{t('store.title')}</h1>
        </div>

        {/* Balance Cards - Stack vertically on mobile */}
        <div className="grid grid-cols-2 gap-3">
          {/* Usage Credits Card */}
          <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">
                {balance.totalAvailable}
              </div>
              <p className="text-sm text-primary/80">{t('balance.credits')}</p>
              {balance.expiringSoon > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>{balance.expiringSoon} {t('balance.expiring_soon')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reward Points Card */}
          <Card className="bg-gradient-to-br from-accent/15 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-accent-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold text-accent-foreground">
                {summary.availableBalance}
              </div>
              <p className="text-sm text-muted-foreground">{t('rewards.balance')}</p>
              {summary.canConvert && summary.availableBalance >= 10 && (
                <Badge className="mt-2 text-xs bg-accent text-accent-foreground">
                  {t('rewards.convert')}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Credits */}
        <DailyCheckInCard />

        {/* Tabs - Full width with larger touch targets */}
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="buy" className="flex flex-col gap-0.5 h-full py-1.5 text-xs">
              <ShoppingCart className="h-4 w-4" />
              <span>{t('store.buy_credits')}</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex flex-col gap-0.5 h-full py-1.5 text-xs">
              <Gift className="h-4 w-4" />
              <span>{t('rewards.title')}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col gap-0.5 h-full py-1.5 text-xs">
              <History className="h-4 w-4" />
              <span>{t('store.history')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Buy Credits Tab */}
          <TabsContent value="buy" className="mt-4 space-y-6">
            <SubscriptionPlansGrid />
            
            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">
                  {t('common:or')}
                </span>
              </div>
            </div>
            
            <CreditPackagesGrid />
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="mt-4 space-y-4">
            {/* Convert Section */}
            <Card>
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
                
                {/* Conversion UI - Simplified for mobile */}
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={summary.availableBalance}
                    step={10}
                    value={pointsToConvert}
                    onChange={(e) => setPointsToConvert(Number(e.target.value))}
                    className="w-full h-2 accent-primary"
                    disabled={!summary.canConvert || summary.availableBalance < 10}
                  />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{pointsToConvert}</div>
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
                  className="w-full h-12" 
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

            {/* Referral Stats - Simplified */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('invitee_status.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Total Earned */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <span className="font-medium">{t('invitee_status.total_earned')}</span>
                  <Badge className="bg-primary text-primary-foreground text-sm">
                    {totalEarnedFromReferrals} {isRTL ? 'نقطة' : 'pts'}
                  </Badge>
                </div>

                {/* Invitees List */}
                {referralLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : inviteesProgress.length === 0 ? (
                  <div className="text-center py-4 space-y-3">
                    <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t('invitee_status.no_invites')}</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/referral-center')}>
                      {t('invitee_status.invite_now')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inviteesProgress.slice(0, 3).map((invitee) => (
                      <div key={invitee.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
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
                        <Badge variant={invitee.stage === 'joined' ? 'default' : 'secondary'} className="text-xs">
                          {t(`invitee_status.stages.${invitee.stage}`)}
                        </Badge>
                      </div>
                    ))}
                    {inviteesProgress.length > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm"
                        onClick={() => navigate('/referral-center')}
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
              className="w-full h-12" 
              variant="outline"
              onClick={() => navigate('/referral-center')}
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
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : consumptionHistory.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('store.no_history')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {consumptionHistory.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                          <Coins className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {t(`actions.${item.action_type}`) || item.action_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'PP', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-destructive border-destructive/30">
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

      <BottomNav />
    </div>
  );
});

CreditStore.displayName = 'CreditStore';
export default CreditStore;
