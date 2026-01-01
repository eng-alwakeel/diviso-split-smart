import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKPITarget, calculateKPIProgress } from "@/hooks/useAdminKPITargets";

export type HealthStatus = 'success' | 'warning' | 'danger' | 'neutral';

interface KPIProgressCardProps {
  title: string;
  value: number | string;
  unit?: string;
  description?: string;
  icon?: LucideIcon;
  kpiName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<HealthStatus, { bg: string; border: string; progressColor: string; text: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    progressColor: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    progressColor: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400'
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    progressColor: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400'
  },
  neutral: {
    bg: 'bg-card',
    border: 'border-border',
    progressColor: 'bg-primary',
    text: 'text-foreground'
  }
};

export const KPIProgressCard = ({
  title,
  value,
  unit = '',
  description,
  icon: Icon,
  kpiName,
  className,
  size = 'md'
}: KPIProgressCardProps) => {
  const target = useKPITarget(kpiName || '');
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  
  let status: HealthStatus = 'neutral';
  let progress: { percentage: number; status: string } | null = null;

  if (target) {
    progress = calculateKPIProgress(numericValue, target);
    status = progress.status as HealthStatus;
  }

  const config = statusConfig[status];

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Card className={cn(config.bg, config.border, 'border', className)}>
      <CardContent className={sizeClasses[size]}>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {title}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={cn(valueSizeClasses[size], 'font-bold', config.text)}>
                  {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
                </span>
                {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {progress && (
              <span className={cn('text-sm font-semibold', config.text)}>
                {progress.percentage}%
              </span>
            )}
          </div>

          {/* Progress bar towards target */}
          {target && progress && (
            <div className="space-y-1.5">
              <Progress 
                value={Math.min(progress.percentage, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>الحالي: {numericValue.toLocaleString('ar-SA')}</span>
                <span>الهدف: {target.target_value.toLocaleString('ar-SA')}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
