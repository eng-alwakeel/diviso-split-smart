import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, DollarSign, TrendingUp, X } from "lucide-react";
import { BudgetWarning } from "@/hooks/useBudgetWarnings";

interface BudgetWarningAlertProps {
  warning: BudgetWarning;
  currency: string;
  onDismiss?: () => void;
}

export const BudgetWarningAlert = ({ warning, currency, onDismiss }: BudgetWarningAlertProps) => {
  const getAlertVariant = () => {
    switch (warning.warning_type) {
      case 'exceed':
        return 'destructive';
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (warning.warning_type) {
      case 'exceed':
        return <X className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (warning.warning_type) {
      case 'exceed':
        return 'تجاوز الميزانية';
      case 'critical':
        return 'تحذير حرج';
      case 'warning':
        return 'تنبيه الميزانية';
      default:
        return 'حالة الميزانية';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (warning.warning_type === 'safe') {
    return null; // لا نعرض تحذير للحالة الآمنة
  }

  return (
    <Alert variant={getAlertVariant()} className="mt-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <AlertTitle className="mb-2">{getTitle()}</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>{warning.message}</p>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-muted-foreground">المنفق حالياً:</span>
                  <div className="font-medium">{formatCurrency(warning.current_spent)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">حد الميزانية:</span>
                  <div className="font-medium">{formatCurrency(warning.budget_limit)}</div>
                </div>
                {warning.warning_type !== 'exceed' && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">المتبقي:</span>
                    <div className="font-medium text-success">
                      {formatCurrency(warning.remaining_amount)}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
};