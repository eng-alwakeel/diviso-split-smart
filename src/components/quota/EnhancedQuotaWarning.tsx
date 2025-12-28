import { AlertTriangle, Crown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface EnhancedQuotaWarningProps {
  quotaType: 'groups' | 'members' | 'expenses' | 'invites' | 'ocr' | 'reportExport';
  current: number;
  limit: number;
  percentage: number;
  warningType: 'warning' | 'critical' | 'blocked' | 'motivation';
}

export const EnhancedQuotaWarning = ({
  quotaType,
  current,
  limit,
  percentage,
  warningType
}: EnhancedQuotaWarningProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('quota');

  const quotaName = t(`items.${quotaType}`, quotaType);

  const getWarningMessage = () => {
    const remaining = Math.round((100 - percentage) / 10);
    
    switch (warningType) {
      case 'blocked':
        return t('warnings.blocked_message', { item: quotaName });
      case 'critical':
        return t('warnings.critical_message', { item: quotaName, percentage: Math.round(percentage), remaining });
      case 'warning':
        return t('warnings.warning_message', { item: quotaName, percentage: Math.round(percentage) });
      case 'motivation':
        return t('warnings.motivation_message', { item: quotaName, percentage: Math.round(percentage) });
      default:
        return t('warnings.status_message', { item: quotaName, percentage: Math.round(percentage) });
    }
  };

  const getUpgradeMessage = () => {
    const suggestionKey = `upgrade.suggestion_${quotaType === 'reportExport' ? 'reports' : quotaType}`;
    return t(suggestionKey, t('upgrade.suggestion_default'));
  };

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
    if (percentage >= 60) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 space-y-3">
          <AlertDescription className="text-sm">
            {getWarningMessage()}
          </AlertDescription>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{current} {t('of')} {limit === -1 ? t('unlimited') : limit}</span>
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
                {t('upgrade.button')}
              </Button>
              <div className="text-xs text-muted-foreground self-center">
                {getUpgradeMessage()}
              </div>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};
