import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUsageData } from "@/hooks/useUsageData";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, Users, Layers, Receipt, MessageSquare, Scan, AlertTriangle, TrendingUp, FileDown, Calendar } from "lucide-react";

export const UsageLimitsCard = () => {
  const { t } = useTranslation(['dashboard', 'quota']);
  
  // Safe navigation hook that handles missing router context
  const getNavigate = () => {
    try {
      return useNavigate();
    } catch (error) {
      console.warn('Navigation context not available:', error);
      return null;
    }
  };
  
  const navigate = getNavigate();
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
            {t('dashboard:usage_limits.title')}
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
      key: "groups",
      label: t('dashboard:usage_limits.groups'),
      current: currentUsage.groups,
      limit: limits.groups,
      icon: Layers,
      color: "text-usage-groups",
      bgColor: "bg-usage-groups/10",
    },
    {
      key: "members",
      label: t('dashboard:usage_limits.members'),
      current: currentUsage.members,
      limit: limits.members,
      icon: Users,
      color: "text-usage-members",
      bgColor: "bg-usage-members/10",
    },
    {
      key: "expenses",
      label: t('dashboard:usage_limits.monthly_expenses'),
      current: currentUsage.expenses,
      limit: limits.expenses,
      icon: Receipt,
      color: "text-usage-expenses",
      bgColor: "bg-usage-expenses/10",
    },
    {
      key: "invites",
      label: t('dashboard:usage_limits.monthly_invites'),
      current: currentUsage.invites,
      limit: limits.invites,
      icon: MessageSquare,
      color: "text-usage-invites",
      bgColor: "bg-usage-invites/10",
    },
    {
      key: "ocr",
      label: t('dashboard:usage_limits.monthly_ocr'),
      current: currentUsage.ocr,
      limit: limits.ocr,
      icon: Scan,
      color: "text-usage-ocr",
      bgColor: "bg-usage-ocr/10",
    },
    {
      key: "reportExport",
      label: t('dashboard:usage_limits.report_export'),
      current: currentUsage.reportExport,
      limit: limits.reportExport,
      icon: FileDown,
      color: "text-usage-export",
      bgColor: "bg-usage-export/10",
    },
    {
      key: "dataRetention",
      label: t('dashboard:usage_limits.data_retention'),
      current: currentUsage.dataRetention,
      limit: limits.dataRetentionMonths,
      icon: Calendar,
      color: "text-usage-retention",
      bgColor: "bg-usage-retention/10",
      unit: t('dashboard:usage_limits.months')
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
            {t('dashboard:usage_limits.title')}
          </CardTitle>
          {hasBlocked && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {t('dashboard:usage_limits.blocked')}
            </Badge>
          )}
          {hasWarnings && !hasBlocked && (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {t('dashboard:usage_limits.warning')}
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
                  {nearLimit && !atLimit && <AlertTriangle className="w-3 h-3 text-warning mr-1" />}
                </div>
              </div>
              
              {item.limit !== -1 && (
                <Progress 
                  value={percentage} 
                  className={`h-2 ${atLimit ? '[&>*]:bg-destructive' : nearLimit ? '[&>*]:bg-warning' : ''}`}
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
              {t('dashboard:usage_limits.average_usage')}
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
              onClick={() => navigate?.('/pricing-protected')}
              className="w-full bg-gradient-primary hover:opacity-90"
              size="sm"
              disabled={!navigate}
            >
              {t('dashboard:usage_limits.upgrade_for_higher_limits')}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {t('dashboard:usage_limits.unlimited_description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
