import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type HealthStatus = 'green' | 'yellow' | 'red' | 'neutral';

interface Threshold {
  green: number;
  yellow: number;
  invert?: boolean; // true if lower is better (e.g., churn rate)
}

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  description?: string;
  icon?: LucideIcon;
  threshold?: Threshold;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getHealthStatus = (value: number, threshold: Threshold): HealthStatus => {
  if (threshold.invert) {
    // Lower is better (e.g., churn rate, expiry rate)
    if (value <= threshold.green) return 'green';
    if (value <= threshold.yellow) return 'yellow';
    return 'red';
  } else {
    // Higher is better (e.g., retention, conversion)
    if (value >= threshold.green) return 'green';
    if (value >= threshold.yellow) return 'yellow';
    return 'red';
  }
};

const statusConfig: Record<HealthStatus, { bg: string; border: string; indicator: string; text: string }> = {
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    indicator: '🟢',
    text: 'text-emerald-700 dark:text-emerald-400'
  },
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    indicator: '🟡',
    text: 'text-amber-700 dark:text-amber-400'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    indicator: '🔴',
    text: 'text-red-700 dark:text-red-400'
  },
  neutral: {
    bg: 'bg-card',
    border: 'border-border',
    indicator: '',
    text: 'text-foreground'
  }
};

export const KPICard = ({
  title,
  value,
  unit = '',
  description,
  icon: Icon,
  threshold,
  trend,
  className,
  size = 'md'
}: KPICardProps) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const status: HealthStatus = threshold ? getHealthStatus(numericValue, threshold) : 'neutral';
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
              {status !== 'neutral' && (
                <span className="text-base">{config.indicator}</span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {trend && (
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                trend.isPositive ? 'text-emerald-600 border-emerald-300' : 'text-red-600 border-red-300'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const HealthIndicator = ({ status }: { status: HealthStatus }) => {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium', config.text)}>
      {config.indicator}
    </span>
  );
};
