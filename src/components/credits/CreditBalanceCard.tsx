import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Gift, ShoppingCart, UserPlus, AlertTriangle } from 'lucide-react';
import { useUsageCredits } from '@/hooks/useUsageCredits';
import { useRewardPoints } from '@/hooks/useRewardPoints';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const CreditBalanceCard = React.memo(() => {
  const { t } = useTranslation('credits');
  const navigate = useNavigate();
  const { balance, loading: creditsLoading } = useUsageCredits();
  const { summary, loading: rewardsLoading } = useRewardPoints();

  if (creditsLoading || rewardsLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasLowBalance = balance.totalAvailable < 10;
  const hasExpiringCredits = balance.expiringSoon > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-primary" />
          {t('balance_card.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-4">
          {/* Usage Credits */}
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className={`text-3xl font-bold ${hasLowBalance ? 'text-destructive' : 'text-primary'}`}>
              {balance.totalAvailable}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('balance_card.usage_credits')}
            </p>
          </div>

          {/* Reward Points */}
          <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="text-3xl font-bold text-accent-foreground">
              {summary.availableBalance}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('balance_card.reward_points')}
            </p>
          </div>
        </div>

        {/* Expiring Warning */}
        {hasExpiringCredits && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 text-warning text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              {t('balance.expiring_soon')}: {balance.expiringSoon}
            </span>
          </div>
        )}

        {/* Low Balance Warning */}
        {hasLowBalance && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{t('balance_card.low_balance')}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/credit-store')}
          >
            <ShoppingCart className="h-4 w-4" />
            {t('balance_card.buy_credits')}
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/referral')}
          >
            <UserPlus className="h-4 w-4" />
            {t('balance_card.invite_friends')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

CreditBalanceCard.displayName = 'CreditBalanceCard';
