import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "./KPICard";
import { 
  useUserActivityMetrics, 
  useCreditsEconomyHealth, 
  useRevenueMetricsKPI,
  useRetentionCohorts 
} from "@/hooks/useAdminKPIs";
import { Users, TrendingUp, DollarSign, Target, UserPlus, Zap, BarChart3, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const ExecutiveSnapshot = () => {
  const { data: activity, isLoading: activityLoading } = useUserActivityMetrics();
  const { data: credits, isLoading: creditsLoading } = useCreditsEconomyHealth();
  const { data: revenue, isLoading: revenueLoading } = useRevenueMetricsKPI();
  const { data: retention, isLoading: retentionLoading } = useRetentionCohorts(2);

  const isLoading = activityLoading || creditsLoading || revenueLoading || retentionLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const latestCohort = retention?.[0];
  const d7Rate = latestCohort?.d7_rate || 0;

  // Revenue mix for pie chart
  const revenueData = [
    { name: 'الاشتراكات', value: revenue?.subscription_revenue || 0, color: 'hsl(var(--chart-1))' },
    { name: 'شراء النقاط', value: revenue?.credits_revenue || 0, color: 'hsl(var(--chart-2))' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لمحة تنفيذية</h2>
          <p className="text-muted-foreground text-sm">نظرة سريعة على أهم المقاييس اليوم</p>
        </div>
      </div>

      {/* Main KPIs - 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="المستخدمون النشطون اليوم (DAU)"
          value={activity?.dau || 0}
          icon={Users}
          description="نشطين اليوم"
          size="md"
        />
        <KPICard
          title="المستخدمون النشطون شهرياً (MAU)"
          value={activity?.mau || 0}
          icon={Users}
          description="نشطين آخر 30 يوم"
          size="md"
        />
        <KPICard
          title="معدل الالتصاق (DAU/MAU)"
          value={activity?.stickiness || 0}
          unit="%"
          icon={TrendingUp}
          threshold={{ green: 30, yellow: 20 }}
          description="Stickiness"
          size="md"
        />
        <KPICard
          title="مستخدمون جدد اليوم"
          value={activity?.new_users_today || 0}
          icon={UserPlus}
          description="تسجيلات جديدة"
          size="md"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="D7 Retention"
          value={d7Rate}
          unit="%"
          icon={Target}
          threshold={{ green: 25, yellow: 15 }}
          description="احتفاظ بعد 7 أيام"
          size="md"
        />
        <KPICard
          title="إيرادات الشهر"
          value={revenue?.total_monthly_revenue || 0}
          unit="ريال"
          icon={DollarSign}
          size="md"
        />
        <KPICard
          title="Paywall Conversion"
          value={credits?.paywall_conversion_rate || 0}
          unit="%"
          icon={Zap}
          threshold={{ green: 8, yellow: 5 }}
          description="تحويل من Paywall"
          size="md"
        />
        <KPICard
          title="ARPPU"
          value={revenue?.arppu || 0}
          unit="ريال"
          icon={Wallet}
          description="متوسط دخل المستخدم الدافع"
          size="md"
        />
      </div>

      {/* Revenue Mix Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع الإيرادات
            </CardTitle>
            <CardDescription>نسبة كل مصدر من الإيرادات</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('ar-SA')} ريال`, '']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                لا توجد إيرادات بعد
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات سريعة</CardTitle>
            <CardDescription>نظرة على المقاييس الرئيسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">المستخدمون النشطون أسبوعياً</span>
              <span className="font-semibold">{activity?.wau?.toLocaleString('ar-SA') || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">مستخدمون جدد هذا الأسبوع</span>
              <span className="font-semibold">{activity?.new_users_week?.toLocaleString('ar-SA') || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">مستخدمون جدد هذا الشهر</span>
              <span className="font-semibold">{activity?.new_users_month?.toLocaleString('ar-SA') || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">المشتركون النشطون</span>
              <span className="font-semibold">{revenue?.subscriber_count?.toLocaleString('ar-SA') || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">معدل الإلغاء (Churn)</span>
              <span className="font-semibold">{revenue?.churn_rate || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
