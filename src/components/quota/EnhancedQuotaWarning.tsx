import { AlertTriangle, Crown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface EnhancedQuotaWarningProps {
  quotaType: 'groups' | 'members' | 'expenses' | 'invites' | 'ocr' | 'reportExport';
  current: number;
  limit: number;
  percentage: number;
  warningType: 'warning' | 'critical' | 'blocked' | 'motivation';
}

const getQuotaDisplayName = (quotaType: string) => {
  const names = {
    groups: 'المجموعات',
    members: 'الأعضاء',
    expenses: 'المصاريف الشهرية',
    invites: 'الدعوات الشهرية',
    ocr: 'مسح الإيصالات الشهرية',
    reportExport: 'تصدير التقارير الشهرية'
  };
  return names[quotaType as keyof typeof names] || quotaType;
};

const getWarningMessage = (quotaType: string, percentage: number, warningType: string) => {
  const quotaName = getQuotaDisplayName(quotaType);
  
  switch (warningType) {
    case 'blocked':
      return `تم الوصول للحد الأقصى من ${quotaName}! قم بالترقية للاستمرار.`;
    case 'critical':
      return `تحذير: تم استخدام ${percentage}% من حد ${quotaName}. فقط ${Math.round((100 - percentage) / 10)} استخدامات متبقية!`;
    case 'warning':
      return `تنبيه: تم استخدام ${percentage}% من حد ${quotaName}. قريب من النفاد.`;
    case 'motivation':
      return `ممتاز! تم استخدام ${percentage}% فقط من حد ${quotaName}. استمر في التوفير!`;
    default:
      return `حالة ${quotaName}: ${percentage}%`;
  }
};

const getUpgradeMessage = (quotaType: string) => {
  const suggestions = {
    groups: 'احصل على مجموعات غير محدودة مع الباقة الشخصية',
    members: 'أضف المزيد من الأعضاء مع الباقات المدفوعة',
    expenses: 'تتبع مصاريف غير محدودة مع الترقية',
    invites: 'ادع عدد غير محدود من الأشخاص',
    ocr: 'امسح الإيصالات بلا حدود مع الذكاء الاصطناعي',
    reportExport: 'صدّر تقارير غير محدودة مع الباقات المدفوعة'
  };
  return suggestions[quotaType as keyof typeof suggestions] || 'احصل على ميزات أكثر مع الترقية';
};

export const EnhancedQuotaWarning = ({
  quotaType,
  current,
  limit,
  percentage,
  warningType
}: EnhancedQuotaWarningProps) => {
  const navigate = useNavigate();

  const getVariant = () => {
    switch (warningType) {
      case 'blocked': return 'destructive';
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'motivation': return 'default';
      default: return 'default';
    }
  };

  const getIcon = () => {
    switch (warningType) {
      case 'blocked': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'motivation': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-destructive';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-primary';
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 space-y-3">
          <AlertDescription className="text-sm">
            {getWarningMessage(quotaType, Math.round(percentage), warningType)}
          </AlertDescription>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{current} من {limit === -1 ? 'غير محدود' : limit}</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <Progress 
              value={Math.min(percentage, 100)} 
              className="h-2"
            />
          </div>

          {(warningType === 'blocked' || warningType === 'critical' || warningType === 'warning') && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => navigate('/pricing-protected')}
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                ترقية الباقة
              </Button>
              <div className="text-xs text-muted-foreground self-center">
                {getUpgradeMessage(quotaType)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};