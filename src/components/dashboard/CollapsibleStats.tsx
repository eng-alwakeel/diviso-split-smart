import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CollapsibleStatsProps {
  monthlyTotalExpenses: number;
  netBalance: number;
  groupsCount: number;
}

export function CollapsibleStats({
  monthlyTotalExpenses,
  netBalance,
  groupsCount,
}: CollapsibleStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const currencySymbol = t('stats.currency');

  const stats = [
    {
      label: t('collapsible_stats.monthly'),
      value: `${monthlyTotalExpenses.toLocaleString()} ${currencySymbol}`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => navigate('/my-expenses'),
    },
    {
      label: t('collapsible_stats.balance'),
      value: `${netBalance.toLocaleString()} ${currencySymbol}`,
      icon: TrendingUp,
      color: netBalance >= 0 ? 'text-green-600' : 'text-red-500',
      bgColor: netBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      onClick: () => navigate('/my-expenses'),
    },
    {
      label: t('collapsible_stats.groups'),
      value: groupsCount.toString(),
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      onClick: () => navigate('/my-groups'),
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Card className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {t('collapsible_stats.title')}
              </p>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="border-border/40 cursor-pointer hover:shadow-sm transition-all"
                onClick={stat.onClick}
              >
                <CardContent className="p-3 text-center">
                  <div className={cn('w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center', stat.bgColor)}>
                    <Icon className={cn('w-4 h-4', stat.color)} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
