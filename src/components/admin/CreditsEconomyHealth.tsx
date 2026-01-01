import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "./KPICard";
import { useCreditsEconomyHealth, useTopCreditActions } from "@/hooks/useAdminKPIs";
import { Coins, TrendingDown, AlertTriangle, Zap, BarChart2, Flame, Timer, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Badge } from "@/components/ui/badge";

export const CreditsEconomyHealth = () => {
  const { data: credits, isLoading: creditsLoading } = useCreditsEconomyHealth();
  const { data: topActions, isLoading: actionsLoading } = useTopCreditActions();

  const isLoading = creditsLoading || actionsLoading;

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

  // Credits flow data for stacked chart
  const creditsFlowData = [
    { name: 'مكتسبة', value: credits?.total_earned || 0, color: 'hsl(var(--chart-1))' },
    { name: 'مستهلكة', value: credits?.total_consumed || 0, color: 'hsl(var(--chart-2))' },
    { name: 'منتهية', value: credits?.total_expired || 0, color: 'hsl(var(--chart-5))' },
    { name: 'مشتراة', value: credits?.total_purchased || 0, color: 'hsl(var(--chart-3))' },
  ];

  // Health status based on expiry rate
  const getHealthStatus = () => {
    const expiryRate = credits?.expiry_rate || 0;
    if (expiryRate <= 30) return { status: '🟢 صحي', color: 'text-emerald-600', message: 'اقتصاد النقاط متوازن' };
    if (expiryRate <= 40) return { status: '🟡 يحتاج مراقبة', color: 'text-amber-600', message: 'نسبة الانتهاء مرتفعة قليلاً' };
    return { status: '🔴 تحذير', color: 'text-red-600', message: 'نسبة الانتهاء عالية جداً - يجب مراجعة القيمة المقدمة' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header with Health Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">صحة اقتصاد النقاط</h2>
          <p className="text-muted-foreground text-sm">هل اقتصاد النقاط متوازن أم يحتاج تعديل؟</p>
        </div>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${healthStatus.color}`}>{healthStatus.status}</span>
          </div>
          <p className="text-xs text-muted-foreground">{healthStatus.message}</p>
        </Card>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="النقاط المكتسبة (مجانية)"
          value={credits?.total_earned || 0}
          icon={Coins}
          description="من المكافآت والإنجازات"
        />
        <KPICard
          title="النقاط المشتراة"
          value={credits?.total_purchased || 0}
          icon={ShoppingCart}
          description="من الاشتراكات والشراء"
        />
        <KPICard
          title="النقاط المستهلكة"
          value={credits?.total_consumed || 0}
          icon={Flame}
        />
        <KPICard
          title="النقاط المنتهية"
          value={credits?.total_expired || 0}
          icon={Timer}
        />
      </div>

      {/* Rate KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="معدل الاستهلاك (Burn Rate)"
          value={credits?.burn_rate || 0}
          unit="%"
          icon={TrendingDown}
          description="نسبة الاستهلاك من الإجمالي"
        />
        <KPICard
          title="معدل الانتهاء (Expiry Rate)"
          value={credits?.expiry_rate || 0}
          unit="%"
          icon={AlertTriangle}
          threshold={{ green: 30, yellow: 40, invert: true }}
          description="نسبة النقاط المنتهية"
        />
        <KPICard
          title="نسبة المجاني للمشتراة"
          value={credits?.earned_vs_purchased_ratio || 0}
          icon={BarChart2}
          description="كم مجاني مقابل كل مشترى"
        />
        <KPICard
          title="Paywall Conversion"
          value={credits?.paywall_conversion_rate || 0}
          unit="%"
          icon={Zap}
          threshold={{ green: 8, yellow: 5 }}
          description="تحويل من شاشة النفاد"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Credits Flow Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع النقاط</CardTitle>
            <CardDescription>مكتسبة vs مستهلكة vs منتهية vs مشتراة</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={creditsFlowData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toLocaleString('ar-SA')}`}
                  labelLine={true}
                >
                  {creditsFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Actions Consuming Credits */}
        <Card>
          <CardHeader>
            <CardTitle>أكثر الإجراءات استهلاكاً للنقاط</CardTitle>
            <CardDescription>ما الذي يستهلك النقاط أكثر؟</CardDescription>
          </CardHeader>
          <CardContent>
            {topActions && topActions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topActions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="action_type" type="category" width={120} fontSize={12} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      value.toLocaleString('ar-SA'),
                      name === 'total_consumed' ? 'إجمالي الاستهلاك' : name
                    ]}
                  />
                  <Bar dataKey="total_consumed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات استهلاك بعد
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paywall Stats */}
      <Card>
        <CardHeader>
          <CardTitle>تحليل Paywall</CardTitle>
          <CardDescription>كم مستخدم وصل لشاشة نفاد الرصيد وماذا فعل؟</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">مرات ظهور Paywall</p>
              <p className="text-2xl font-bold">{credits?.paywall_hit_count?.toLocaleString('ar-SA') || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">معدل التحويل</p>
              <p className="text-2xl font-bold">{credits?.paywall_conversion_rate || 0}%</p>
              {credits?.paywall_conversion_rate && credits.paywall_conversion_rate >= 8 ? (
                <Badge className="bg-emerald-500">🟢 ممتاز</Badge>
              ) : credits?.paywall_conversion_rate && credits.paywall_conversion_rate >= 5 ? (
                <Badge className="bg-amber-500">🟡 جيد</Badge>
              ) : (
                <Badge className="bg-red-500">🔴 يحتاج تحسين</Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">التحويلات المتوقعة</p>
              <p className="text-2xl font-bold">
                {credits?.paywall_hit_count && credits?.paywall_conversion_rate
                  ? Math.round((credits.paywall_hit_count * credits.paywall_conversion_rate) / 100)
                  : 0
                }
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الفرصة الضائعة</p>
              <p className="text-2xl font-bold">
                {credits?.paywall_hit_count && credits?.paywall_conversion_rate
                  ? credits.paywall_hit_count - Math.round((credits.paywall_hit_count * credits.paywall_conversion_rate) / 100)
                  : 0
                }
              </p>
              <p className="text-xs text-muted-foreground">مستخدم لم يتحول</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {credits?.expiry_rate && credits.expiry_rate > 35 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-400">تحذير: نسبة انتهاء النقاط مرتفعة ({credits.expiry_rate}%)</p>
              <p className="text-sm text-red-600 dark:text-red-500">
                هذا يشير إلى أن المستخدمين لا يجدون قيمة كافية لاستخدام نقاطهم. 
                يُنصح بمراجعة: 1) أسعار الميزات 2) فترة صلاحية النقاط 3) القيمة المقدمة
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
