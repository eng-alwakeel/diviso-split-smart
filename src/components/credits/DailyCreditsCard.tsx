import { Gift, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDailyCredits } from '@/hooks/useDailyCredits';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export function DailyCreditsCard() {
  const { 
    canClaim, 
    hoursUntilNext, 
    dailyAmount, 
    loading, 
    claiming, 
    claimDailyCredits 
  } = useDailyCredits();
  const { t } = useTranslation('credits');

  if (loading) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-dashed transition-all ${
      canClaim 
        ? 'border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10' 
        : 'border-muted-foreground/20 bg-muted/30'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            canClaim 
              ? 'bg-primary/20 text-primary animate-pulse' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {canClaim ? (
              <Gift className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{t('daily.title')}</h4>
            <p className="text-sm text-muted-foreground">
              {canClaim ? (
                <span className="text-primary font-medium">{t('daily.available')}</span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('daily.next_in', { hours: hoursUntilNext })}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={canClaim ? 'default' : 'secondary'} className="text-xs">
              {t('daily.amount', { amount: dailyAmount })}
            </Badge>
            
            {canClaim && (
              <Button 
                size="sm" 
                onClick={claimDailyCredits}
                disabled={claiming}
                className="gap-1"
              >
                {claiming ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('daily.claiming')}
                  </>
                ) : (
                  <>
                    <Gift className="h-3 w-3" />
                    {t('daily.claim')}
                  </>
                )}
              </Button>
            )}
            
            {!canClaim && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {t('daily.claimed')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
