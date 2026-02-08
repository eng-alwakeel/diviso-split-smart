import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BalanceStatusCardProps {
  netBalance: number;
}

type BalanceState = 'balanced' | 'near_balanced' | 'unbalanced';

function getBalanceState(netBalance: number): BalanceState {
  if (netBalance === 0) return 'balanced';
  if (Math.abs(netBalance) < 50) return 'near_balanced';
  return 'unbalanced';
}

const stateConfig: Record<BalanceState, { emoji: string; border: string; bg: string }> = {
  balanced: {
    emoji: '✅',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
  },
  near_balanced: {
    emoji: '⚠️',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
  },
  unbalanced: {
    emoji: '❌',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
  },
};

export function BalanceStatusCard({ netBalance }: BalanceStatusCardProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const state = getBalanceState(netBalance);
  const config = stateConfig[state];

  return (
    <Card className={cn('transition-colors', config.border, config.bg)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {config.emoji} {t(`balance_status.${state}`)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`balance_status.${state}_sub`)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/my-expenses')}
            className="shrink-0 text-xs"
          >
            {t('balance_status.view_details')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
