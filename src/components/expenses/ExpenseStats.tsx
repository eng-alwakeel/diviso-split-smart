import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Receipt, Clock, CheckCircle, XCircle } from "lucide-react";
import { ExpenseStats as StatsType } from "@/hooks/useMyExpenses";

interface ExpenseStatsProps {
  stats: StatsType;
  currency?: string;
}

export const ExpenseStats = ({ stats, currency = 'SAR' }: ExpenseStatsProps) => {
  const netBalanceColor = stats.total_net > 0 ? 'text-success' : stats.total_net < 0 ? 'text-destructive' : 'text-muted-foreground';
  const netBalanceIcon = stats.total_net > 0 ? TrendingUp : stats.total_net < 0 ? TrendingDown : DollarSign;
  const NetIcon = netBalanceIcon;

  const approvalRate = stats.total_count > 0 ? (stats.total_count - stats.rejected_count) / stats.total_count * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Net Balance */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الرصيد الصافي</CardTitle>
          <NetIcon className={`h-4 w-4 ${netBalanceColor}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netBalanceColor}`}>
            {stats.total_net > 0 ? '+' : ''}
            {stats.total_net.toLocaleString()} {currency}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total_net > 0 ? 'يجب أن تستلم' : stats.total_net < 0 ? 'يجب أن تدفع' : 'متوازن'}
          </p>
        </CardContent>
      </Card>

      {/* Total Paid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المدفوع</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {stats.total_paid.toLocaleString()} {currency}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-success border-success/20">
              {stats.approved_paid.toLocaleString()} مُوافق
            </Badge>
            <Badge variant="outline" className="text-warning border-warning/20">
              {stats.pending_paid.toLocaleString()} معلق
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Total Owed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المستحق</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {stats.total_owed.toLocaleString()} {currency}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-success border-success/20">
              {stats.approved_owed.toLocaleString()} مُوافق
            </Badge>
            <Badge variant="outline" className="text-warning border-warning/20">
              {stats.pending_owed.toLocaleString()} معلق
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Activity Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">نظرة عامة</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                المصاريف
              </span>
              <span className="font-medium">{stats.total_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                المجموعات
              </span>
              <span className="font-medium">{stats.groups_count}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>معدل الموافقة</span>
                <span>{approvalRate.toFixed(0)}%</span>
              </div>
              <Progress value={approvalRate} className="h-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">تفصيل حالة المصاريف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">مُوافق عليه</p>
                <p className="text-xl font-bold text-success">
                  {stats.total_count - stats.rejected_count - (stats.pending_paid > 0 || stats.pending_owed > 0 ? 1 : 0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">في الانتظار</p>
                <p className="text-xl font-bold text-warning">
                  {(stats.pending_paid > 0 || stats.pending_owed > 0) ? 1 : 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
              <div className="p-2 rounded-full bg-destructive/10">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">مرفوض</p>
                <p className="text-xl font-bold text-destructive">{stats.rejected_count}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};