import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface StatsLiteCardProps {
  monthlyTotalExpenses: number;
  netBalance: number;
  groupsCount: number;
  outstandingAmount: number;
}

export function StatsLiteCard({
  monthlyTotalExpenses,
  netBalance,
  groupsCount,
  outstandingAmount,
}: StatsLiteCardProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const currency = t('stats.currency');

  const hasData = monthlyTotalExpenses > 0 || groupsCount > 0 || netBalance !== 0;

  if (!hasData) {
    return (
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">{t('stats_lite.no_data')}</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: t('stats_lite.monthly'),
      value: `${monthlyTotalExpenses.toLocaleString()} ${currency}`,
      color: 'text-foreground',
      onClick: () => navigate('/my-expenses'),
    },
    {
      label: t('stats_lite.balance'),
      value: `${netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString()} ${currency}`,
      color: netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
      onClick: () => navigate('/my-expenses'),
    },
    {
      label: t('stats_lite.groups'),
      value: groupsCount.toString(),
      color: 'text-foreground',
      onClick: () => navigate('/my-groups'),
    },
    {
      label: t('stats_lite.outstanding'),
      value: outstandingAmount > 0
        ? `${outstandingAmount.toLocaleString()} ${currency}`
        : t('stats_lite.no_outstanding'),
      color: outstandingAmount > 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground',
      onClick: () => navigate('/my-expenses'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border-border/40 bg-card/60 cursor-pointer hover:bg-muted/30 transition-colors active:scale-[0.98]"
          onClick={stat.onClick}
        >
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1 truncate">{stat.label}</p>
            <p className={cn('text-sm font-semibold truncate', stat.color)}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
