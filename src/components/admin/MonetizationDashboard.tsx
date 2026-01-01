import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "./KPICard";
import { useRevenueMetricsKPI, useGrowthLoopMetrics } from "@/hooks/useAdminKPIs";
import { DollarSign, Users, TrendingDown, TrendingUp, CreditCard, Wallet, RefreshCw, UserMinus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const MonetizationDashboard = () => {
  const { data: revenue, isLoading: revenueLoading } = useRevenueMetricsKPI();
  const { data: growth, isLoading: growthLoading } = useGrowthLoopMetrics();

  const isLoading = revenueLoading || growthLoading;

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

  // Revenue comparison data for chart
  const revenueData = [
    {
      name: 'الاشتراكات',
      value: revenue?.subscription_revenue || 0,
    },
    {
      name: 'شراء النقاط',
      value: revenue?.credits_revenue || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">لوحة الإيرادات والربحية</h2>
        <p className="text-muted-foreground text-sm">هل الدخل ينمو بشكل صحي؟ وأي مصدر هو الأقوى؟</p>
      </div>

      {/* Main Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="إجمالي إيرادات الشهر"
          value={revenue?.total_monthly_revenue || 0}
          unit="ريال"
          icon={DollarSign}
          size="md"
        />
        <KPICard
          title="إيرادات الاشتراكات"
          value={revenue?.subscription_revenue || 0}
          unit="ريال"
          icon={CreditCard}
          size="md"
        />
        <KPICard
          title="إيرادات شراء النقاط"
          value={revenue?.credits_revenue || 0}
          unit="ريال"
          icon={Wallet}
          size="md"
        />
        <KPICard
          title="ARPPU"
          value={revenue?.arppu || 0}
          unit="ريال"
          icon={TrendingUp}
          description="متوسط دخل المستخدم الدافع"
          size="md"
        />
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="المشتركون النشطون"
          value={revenue?.subscriber_count || 0}
          icon={Users}
        />
        <KPICard
          title="مشتركون جدد هذا الشهر"
          value={revenue?.new_subscribers || 0}
          icon={TrendingUp}
        />
        <KPICard
          title="ألغوا الاشتراك"
          value={revenue?.churned_subscribers || 0}
          icon={UserMinus}
        />
        <KPICard
          title="معدل الإلغاء (Churn)"
          value={revenue?.churn_rate || 0}
          unit="%"
          icon={TrendingDown}
          threshold={{ green: 5, yellow: 10, invert: true }}
          description="نسبة الإلغاء الشهرية"
        />
      </div>

      {/* Revenue Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>مقارنة مصادر الإيرادات</CardTitle>
            <CardDescription>الاشتراكات مقابل شراء النقاط</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('ar-SA')} ريال`, '']}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* LTV Estimation */}
        <Card>
          <CardHeader>
            <CardTitle>تقدير القيمة الدائمة (LTV)</CardTitle>
            <CardDescription>بناءً على معدل الإلغاء والإيرادات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ARPPU</span>
                <span className="font-semibold">{revenue?.arppu?.toLocaleString('ar-SA') || 0} ريال</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">معدل الإلغاء الشهري</span>
                <span className="font-semibold">{revenue?.churn_rate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">متوسط عمر العميل (أشهر)</span>
                <span className="font-semibold">
                  {revenue?.churn_rate && revenue.churn_rate > 0 
                    ? (100 / revenue.churn_rate).toFixed(1)
                    : '∞'
                  }
                </span>
              </div>
              <hr />
              <div className="flex justify-between text-lg">
                <span className="font-medium">LTV التقديري</span>
                <span className="font-bold text-primary">
                  {revenue?.arppu && revenue?.churn_rate && revenue.churn_rate > 0
                    ? ((revenue.arppu / (revenue.churn_rate / 100))).toLocaleString('ar-SA', { maximumFractionDigits: 0 })
                    : '∞'
                  } ريال
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * LTV = ARPPU / Churn Rate (تقدير مبسط)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Revenue Impact */}
      <Card>
        <CardHeader>
          <CardTitle>تأثير الإحالات على الإيرادات</CardTitle>
          <CardDescription>كم من الإيرادات جاءت عبر الإحالات؟</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">إجمالي الإحالات الناجحة</p>
              <p className="text-2xl font-bold">{growth?.referral_signups?.toLocaleString('ar-SA') || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">نسبة المستخدمين من الإحالات</p>
              <p className="text-2xl font-bold">{growth?.referral_signup_rate || 0}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">K-Factor</p>
              <p className="text-2xl font-bold">{growth?.k_factor || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المحيلون النشطون</p>
              <p className="text-2xl font-bold">{growth?.active_referrers?.toLocaleString('ar-SA') || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
