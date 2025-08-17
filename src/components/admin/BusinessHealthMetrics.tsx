import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Target,
  Star
} from "lucide-react";
import { BusinessMetrics } from "@/hooks/useBusinessMetrics";

interface BusinessHealthMetricsProps {
  data: BusinessMetrics;
  isLoading?: boolean;
}

export const BusinessHealthMetrics = ({ data, isLoading }: BusinessHealthMetricsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const healthScore = ((100 - data.churn_rate) + data.conversion_rate + (data.retention_rate)) / 3;
  const isHealthy = healthScore >= 75;

  return (
    <div className="space-y-6">
      {/* Health Score Alert */}
      <Alert className={isHealthy ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          )}
          <AlertDescription className={isHealthy ? "text-green-800" : "text-orange-800"}>
            <strong>مؤشر صحة الأعمال: {healthScore.toFixed(1)}%</strong> - 
            {isHealthy ? " الأعمال في حالة ممتازة" : " يحتاج انتباه وتحسين"}
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Retention & Churn */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              معدلات الاحتفاظ والإلغاء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">معدل الاحتفاظ</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {data.retention_rate.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={data.retention_rate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">معدل الإلغاء</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {data.churn_rate.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={data.churn_rate} className="h-2" />
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>المستخدمين المعرضين للخطر</span>
                <span className="font-medium text-red-600">
                  {data.at_risk_users} مستخدم
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              صحة النشاط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">المجموعات النشطة</span>
              <Badge variant="outline">
                {data.active_groups_with_expenses}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">متوسط المصروفات لكل مجموعة</span>
              <Badge variant="outline">
                {data.avg_expenses_per_group.toFixed(1)} ريال
              </Badge>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">نسبة النشاط الفعلي: </span>
                <span className="font-medium">
                  {((data.active_groups_with_expenses / data.active_paying_users) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              فرص النمو
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">مرشحين للترقية</span>
              <Badge className="bg-purple-100 text-purple-800">
                {data.upgrade_candidates} مستخدم
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">إمكانية زيادة الإيرادات</span>
              <Badge className="bg-green-100 text-green-800">
                +{(data.upgrade_candidates * data.arpu * 0.7).toFixed(0)} ريال
              </Badge>
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground">
              * مبني على متوسط الإيراد لكل مستخدم ومعدل التحويل المتوقع
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              ملخص الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">معدل التحويل</span>
              <div className="flex items-center gap-1">
                {data.conversion_rate > 15 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${data.conversion_rate > 15 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.conversion_rate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">نمو الإيرادات</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">
                  +{data.revenue_growth_rate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">متوسط الإيراد لكل مستخدم</span>
              <Badge variant="outline">
                {data.arpu.toFixed(2)} ريال
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};