import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpIcon, ArrowDownIcon, TrendingUp, DollarSign, Users, Target } from "lucide-react";
import { BusinessMetrics } from "@/hooks/useBusinessMetrics";

interface RevenueMetricsCardsProps {
  data: BusinessMetrics;
  isLoading?: boolean;
}

export const RevenueMetricsCards = ({ data, isLoading }: RevenueMetricsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const revenueGrowth = ((data.monthly_revenue - data.previous_month_revenue) / data.previous_month_revenue) * 100;
  const userGrowth = ((data.active_paying_users - data.previous_month_users) / data.previous_month_users) * 100;

  const metrics = [
    {
      title: "الإيرادات الشهرية",
      value: `${data.monthly_revenue.toLocaleString('ar-SA')} ريال`,
      change: revenueGrowth,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "متوسط الإيراد لكل مستخدم",
      value: `${data.arpu.toFixed(2)} ريال`,
      change: data.revenue_growth_rate,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "المستخدمين المدفوعين",
      value: data.active_paying_users.toLocaleString('ar-SA'),
      change: userGrowth,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "معدل التحويل",
      value: `${data.conversion_rate.toFixed(1)}%`,
      change: data.conversion_rate - 12.5, // Mock previous rate
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change > 0;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {metric.value}
              </div>
              <div className="flex items-center gap-1 text-xs">
                {isPositive ? (
                  <ArrowUpIcon className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 text-red-500" />
                )}
                <span className={isPositive ? "text-green-600" : "text-red-600"}>
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};