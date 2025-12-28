import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { MyExpense } from "@/hooks/useMyExpenses";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface ExpenseChartProps {
  expenses: MyExpense[];
  currency?: string;
}

export const ExpenseChart = ({ expenses, currency = 'SAR' }: ExpenseChartProps) => {
  const { t, i18n } = useTranslation('expenses');
  const isArabic = i18n.language === 'ar';
  const dateLocale = isArabic ? ar : enUS;

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.spent_at);
        return expenseDate >= monthStart && expenseDate <= monthEnd && expense.status === 'approved';
      });

      const totalPaid = monthExpenses
        .filter(expense => expense.payer_id === expense.created_by)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const totalOwed = monthExpenses
        .reduce((sum, expense) => {
          const userSplit = expense.splits.find(split => split.member_id === expense.created_by);
          return sum + (userSplit?.share_amount || 0);
        }, 0);

      return {
        month: format(month, 'MMM yyyy', { locale: dateLocale }),
        paid: totalPaid,
        owed: totalOwed,
        net: totalPaid - totalOwed,
        count: monthExpenses.length
      };
    });
  }, [expenses, dateLocale]);

  // Status distribution data
  const statusData = useMemo(() => {
    const statusCounts = expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: t('status.approved'), value: statusCounts.approved || 0, color: 'hsl(var(--success))' },
      { name: t('status.pending'), value: statusCounts.pending || 0, color: 'hsl(var(--warning))' },
      { name: t('status.rejected'), value: statusCounts.rejected || 0, color: 'hsl(var(--destructive))' }
    ].filter(item => item.value > 0);
  }, [expenses, t]);

  // Group distribution data
  const groupData = useMemo(() => {
    const groupTotals = expenses
      .filter(expense => expense.status === 'approved')
      .reduce((acc, expense) => {
        const userSplit = expense.splits.find(split => split.member_id === expense.created_by);
        const shareAmount = userSplit?.share_amount || 0;
        
        if (!acc[expense.group_name]) {
          acc[expense.group_name] = { name: expense.group_name, amount: 0, count: 0 };
        }
        acc[expense.group_name].amount += shareAmount;
        acc[expense.group_name].count += 1;
        return acc;
      }, {} as Record<string, { name: string; amount: number; count: number }>);

    return Object.values(groupTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 groups
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toLocaleString()} {currency}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Monthly Trend */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">{t('charts.monthly_trend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="paid" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name={t('charts.paid')}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="owed" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name={t('charts.owed')}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name={t('charts.net')}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('charts.status_distribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value, t('charts.count')]}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-4">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('charts.top_groups')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={groupData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={80}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, t('charts.amount')]}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};