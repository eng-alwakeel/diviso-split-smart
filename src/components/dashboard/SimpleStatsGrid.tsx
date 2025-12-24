import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Receipt, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface SimpleStatsGridProps {
  monthlyTotalExpenses: number;
  groupsCount: number;
  weeklyExpensesCount: number;
  myPaid: number;
  myOwed: number;
}

export const SimpleStatsGrid = ({ 
  monthlyTotalExpenses, 
  groupsCount, 
  weeklyExpensesCount,
  myPaid,
  myOwed
}: SimpleStatsGridProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('dashboard');
  const netBalance = myPaid - myOwed;
  const currencySymbol = t('stats.currency');

  const stats = [
    {
      title: t('stats.net_balance'),
      value: `${netBalance.toLocaleString()} ${currencySymbol}`,
      subtitle: netBalance >= 0 ? t('stats.for_you') : t('stats.against_you'),
      icon: TrendingUp,
      color: netBalance >= 0 ? "text-status-positive" : "text-status-negative",
      bgColor: netBalance >= 0 ? "bg-status-positive-bg" : "bg-status-negative-bg",
      onClick: () => navigate('/my-expenses'),
    },
    {
      title: t('stats.monthly_expenses'),
      value: `${monthlyTotalExpenses.toLocaleString()} ${currencySymbol}`,
      subtitle: t('stats.this_month'),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      onClick: () => navigate('/my-expenses'),
    },
    {
      title: t('stats.groups'),
      value: groupsCount.toString(),
      subtitle: t('stats.active'),
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
      onClick: () => navigate('/my-groups'),
    },
    {
      title: t('stats.total_paid'),
      value: `${myPaid.toLocaleString()} ${currencySymbol}`,
      subtitle: t('stats.total'),
      icon: Receipt,
      color: "text-warning",
      bgColor: "bg-warning/10",
      onClick: () => navigate('/my-expenses'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card 
            key={index}
            className="border border-border hover:shadow-sm transition-all duration-200 cursor-pointer" 
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <IconComponent className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
