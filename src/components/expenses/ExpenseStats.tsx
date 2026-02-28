import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Users } from "lucide-react";
import { ExpenseStats as StatsType } from "@/hooks/useMyExpenses";

interface ExpenseStatsProps {
  stats: StatsType;
  currency?: string;
}

export const ExpenseStats = ({ stats, currency = 'SAR' }: ExpenseStatsProps) => {
  const { t } = useTranslation('expenses');
  const netPositive = stats.total_net > 0;
  const netNegative = stats.total_net < 0;

  const approvalRate = stats.total_count > 0 ? ((stats.total_count - stats.rejected_count) / stats.total_count * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Net Balance */}
      <Card className={`border-s-4 ${netPositive ? 'border-s-success' : netNegative ? 'border-s-destructive' : 'border-s-muted-foreground'}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-1 mb-1">
            {netPositive ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : netNegative ? <TrendingDown className="h-3.5 w-3.5 text-destructive" /> : <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-[11px] text-muted-foreground">{t('stats.net_balance')}</span>
          </div>
          <p className={`text-2xl font-black ${netPositive ? 'text-success' : netNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
            {netPositive ? '+' : ''}{stats.total_net.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {currency} · {netPositive ? t('stats.should_receive') : netNegative ? t('stats.should_pay') : t('stats.balanced')}
          </p>
        </CardContent>
      </Card>

      {/* Total Paid */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-[11px] text-muted-foreground">{t('stats.total_paid')}</span>
          </div>
          <p className="text-2xl font-black text-success">
            {stats.total_paid.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
            <span className="text-success">{t('stats.approved')}: {stats.approved_paid.toLocaleString()}</span>
            <span>·</span>
            <span className="text-warning">{t('stats.pending')}: {stats.pending_paid.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Owed */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            <span className="text-[11px] text-muted-foreground">{t('stats.total_owed')}</span>
          </div>
          <p className="text-2xl font-black text-destructive">
            {stats.total_owed.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
            <span className="text-success">{t('stats.approved')}: {stats.approved_owed.toLocaleString()}</span>
            <span>·</span>
            <span className="text-warning">{t('stats.pending')}: {stats.pending_owed.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1 mb-1">
            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{t('stats.overview')}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Receipt className="h-3 w-3" />{t('stats.expenses')}</span>
              <span className="text-sm font-bold">{stats.total_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{t('stats.groups')}</span>
              <span className="text-sm font-bold">{stats.groups_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{t('stats.approval_rate')}</span>
              <span className="text-sm font-bold">{approvalRate.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
