import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "./KPICard";
import { useFunnelMetrics, useGrowthLoopMetrics } from "@/hooks/useAdminKPIs";
import { Users, UserCheck, Zap, Crown, Clock, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const FunnelAnalytics = () => {
  const { data: funnel, isLoading: funnelLoading } = useFunnelMetrics();
  const { data: growth, isLoading: growthLoading } = useGrowthLoopMetrics();

  const isLoading = funnelLoading || growthLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  // Funnel stages with percentages
  const funnelStages = [
    { 
      name: 'تسجيل جديد', 
      count: funnel?.total_signups || 0, 
      percentage: 100,
      icon: Users
    },
    { 
      name: 'تفعيل (أول قيمة)', 
      count: funnel?.activated_users || 0, 
      percentage: funnel?.activation_rate || 0,
      icon: UserCheck
    },
    { 
      name: 'نشط بعد 7 أيام', 
      count: funnel?.seven_day_active || 0, 
      percentage: funnel?.retention_to_7d || 0,
      icon: Zap
    },
    { 
      name: 'تحويل للدفع', 
      count: funnel?.converted_to_paid || 0, 
      percentage: funnel?.conversion_rate || 0,
      icon: Crown
    },
  ];

  // Parse average time to first value
  const formatInterval = (interval: string): string => {
    if (!interval || interval === '0' || interval === 'PT0S') return 'غير متاح';
    // Simple parsing for PostgreSQL interval
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      if (hours > 24) {
        return `${Math.floor(hours / 24)} يوم`;
      }
      if (hours > 0) {
        return `${hours} ساعة`;
      }
      return `${minutes} دقيقة`;
    }
    return interval;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">تحليل القمع والتفعيل</h2>
        <p className="text-muted-foreground text-sm">أين نخسر المستخدمين؟ وكيف نصلح التجربة الأولى؟</p>
      </div>

      {/* Visual Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>قمع تحويل المستخدمين</CardTitle>
          <CardDescription>من التسجيل إلى الدفع (آخر 30 يوم)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelStages.map((stage, index) => {
              const Icon = stage.icon;
              const width = Math.max(stage.percentage, 5); // Minimum width for visibility
              
              return (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {stage.count.toLocaleString('ar-SA')} مستخدم
                      </span>
                      <span className="font-semibold text-primary">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={width} className="h-8" />
                    {index < funnelStages.length - 1 && (
                      <div className="absolute -bottom-4 right-1/2 transform translate-x-1/2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="معدل التفعيل"
          value={funnel?.activation_rate || 0}
          unit="%"
          icon={UserCheck}
          threshold={{ green: 40, yellow: 25 }}
          description="خلال 48 ساعة من التسجيل"
        />
        <KPICard
          title="الاحتفاظ بعد 7 أيام"
          value={funnel?.retention_to_7d || 0}
          unit="%"
          icon={Zap}
          threshold={{ green: 25, yellow: 15 }}
        />
        <KPICard
          title="معدل التحويل للدفع"
          value={funnel?.conversion_rate || 0}
          unit="%"
          icon={Crown}
          threshold={{ green: 5, yellow: 2 }}
        />
        <KPICard
          title="وقت أول قيمة"
          value={formatInterval(funnel?.avg_time_to_first_value || '0')}
          icon={Clock}
          description="متوسط الوقت لأول مصروف/مجموعة"
        />
      </div>

      {/* Growth Loop Stats */}
      <Card>
        <CardHeader>
          <CardTitle>حلقة النمو (Growth Loop)</CardTitle>
          <CardDescription>تحليل الدعوات والإحالات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">إجمالي الدعوات</p>
              <p className="text-2xl font-bold">{growth?.total_invites_sent?.toLocaleString('ar-SA') || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">دعوات هذا الأسبوع</p>
              <p className="text-2xl font-bold">{growth?.invites_this_week?.toLocaleString('ar-SA') || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">معدل تحويل الدعوات</p>
              <p className="text-2xl font-bold">{growth?.invite_conversion_rate || 0}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">K-Factor</p>
              <p className="text-2xl font-bold">{growth?.k_factor || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
