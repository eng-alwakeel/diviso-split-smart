import { Coins, AlertTriangle } from 'lucide-react';
import { useUsageCredits } from '@/hooks/useUsageCredits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreditBalanceProps {
  compact?: boolean;
  showWarning?: boolean;
}

export function CreditBalance({ compact = false, showWarning = true }: CreditBalanceProps) {
  const { balance, loading } = useUsageCredits();
  const navigate = useNavigate();
  const { t } = useTranslation('credits');

  if (loading) {
    return <Skeleton className="h-8 w-16" />;
  }

  const hasLowBalance = balance.totalAvailable < 10;
  const hasMediumBalance = balance.totalAvailable >= 10 && balance.totalAvailable <= 20;
  const hasExpiringCredits = balance.expiringSoon > 0;

  // Dynamic color based on balance level
  const getBalanceColor = () => {
    if (hasLowBalance) return 'text-destructive';
    if (hasMediumBalance) return 'text-warning';
    return 'text-primary';
  };

  const getIconColor = () => {
    if (hasLowBalance) return 'text-destructive';
    if (hasMediumBalance) return 'text-warning';
    return 'text-primary';
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 px-2 h-8 ${hasLowBalance ? 'animate-pulse' : ''}`}
              onClick={() => navigate('/credit-store')}
            >
              <Coins className={`h-4 w-4 ${getIconColor()}`} />
              <span className={`font-medium ${getBalanceColor()}`}>
                {balance.totalAvailable}
              </span>
              {hasLowBalance && showWarning && (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-center space-y-1">
            <p className="font-medium">{t('balance.current')}: {balance.totalAvailable} {t('balance.credits')}</p>
            {hasExpiringCredits && balance.expiringSoonDate && (
              <p className="text-warning text-xs">
                {balance.expiringSoon} {t('balance.expiring_soon')}
              </p>
            )}
            {hasLowBalance && (
              <p className="text-destructive text-xs">{t('balance.no_credits')}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
      onClick={() => navigate('/credit-store')}
    >
      <Coins className="h-5 w-5 text-primary" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {balance.totalAvailable} {t('balance.credits')}
        </span>
        {hasExpiringCredits && balance.expiringSoonDate && (
          <span className="text-xs text-warning">
            {balance.expiringSoon} {t('balance.expiring_soon')}
          </span>
        )}
      </div>
      {hasLowBalance && showWarning && (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
          {t('balance.no_credits')}
        </Badge>
      )}
    </div>
  );
}
