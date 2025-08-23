import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUsageData } from "@/hooks/useUsageData";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, Layers, Receipt, MessageSquare, Scan, AlertTriangle, TrendingUp, FileDown, Calendar } from "lucide-react";

export const UsageLimitsCard = () => {
  const navigate = useNavigate();
  const { limits, loading, isFreePlan, formatLimit, getUsagePercentage, isNearLimit, isAtLimit, currentPlan } = useSubscriptionLimits();
  const { groupsCount, monthlyTotalExpenses, loading: dashboardLoading } = useDashboardData();
  const { usage, loading: usageLoading, error: usageError } = useUsageData();

  console.log('UsageLimitsCard: Rendering with:', {
    limits,
    loading,
    isFreePlan,
    currentPlan,
    groupsCount,
    dashboardLoading,
    usage,
    usageLoading,
    usageError
  });

  if (loading || !limits || usageLoading) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            حدود الاستخدام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // استخدام البيانات الفعلية من قاعدة البيانات
  const currentUsage = {
    groups: usage.groups,
    members: usage.members,
    expenses: usage.expenses,
    invites: usage.invites,
    ocr: usage.ocr,
    reportExport: usage.reportExport,
    dataRetention: usage.dataRetention
  };

  const usageItems = [
    {
      label: "المجموعات",
      current: currentUsage.groups,
      limit: limits.groups,
      icon: Layers,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "الأعضاء",
      current: currentUsage.members,
      limit: limits.members,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "المصاريف (شهرياً)",
      current: currentUsage.expenses,
      limit: limits.expenses,
      icon: Receipt,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "الدعوات (شهرياً)",
      current: currentUsage.invites,
      limit: limits.invites,
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "مسح الإيصالات (شهرياً)",
      current: currentUsage.ocr,
      limit: limits.ocr,
      icon: Scan,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "تصدير التقارير (شهرياً)",
      current: currentUsage.reportExport,
      limit: limits.reportExport,
      icon: FileDown,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      label: "مدة حفظ البيانات",
      current: currentUsage.dataRetention,
      limit: limits.dataRetentionMonths,
      icon: Calendar,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      unit: "شهر"
    },
  ];

  const hasWarnings = usageItems.some(item => isNearLimit(item.current, item.limit));
  const hasBlocked = usageItems.some(item => isAtLimit(item.current, item.limit));

  return (
    <Card className="border border-border hover:shadow-sm transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            حدود الاستخدام
          </CardTitle>
          {hasBlocked && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              محظور
            </Badge>
          )}
          {hasWarnings && !hasBlocked && (
            <Badge className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              تحذير
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {usageItems.map((item, index) => {
          const IconComponent = item.icon;
          const percentage = getUsagePercentage(item.current, item.limit);
          const nearLimit = isNearLimit(item.current, item.limit);
          const atLimit = isAtLimit(item.current, item.limit);
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded ${item.bgColor} flex items-center justify-center`}>
                    <IconComponent className={`w-3 h-3 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-foreground font-medium">{item.current}</span>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="text-sm text-muted-foreground">{formatLimit(item.limit)}</span>
                  {item.unit && <span className="text-xs text-muted-foreground mr-1">{item.unit}</span>}
                  {atLimit && <AlertTriangle className="w-3 h-3 text-destructive mr-1" />}
                  {nearLimit && !atLimit && <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />}
                </div>
              </div>
              
              {item.limit !== -1 && (
                <Progress 
                  value={percentage} 
                  className={`h-2 ${atLimit ? '[&>*]:bg-destructive' : nearLimit ? '[&>*]:bg-orange-500' : ''}`}
                />
              )}
            </div>
          );
        })}

        {/* إحصائيات سريعة */}
        <div className="pt-2 mt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              معدل الاستخدام:
            </span>
            <span className="font-medium text-foreground">
              {Math.round(usageItems.reduce((acc, item) => acc + getUsagePercentage(item.current, item.limit), 0) / usageItems.length)}%
            </span>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        {isFreePlan && (hasWarnings || hasBlocked) && (
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/pricing-protected')}
              className="w-full bg-gradient-primary hover:opacity-90"
              size="sm"
            >
              ترقية للحصول على حدود أعلى
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              احصل على مصاريف غير محدودة ومسح إيصالات أكثر مع الباقات المدفوعة
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};