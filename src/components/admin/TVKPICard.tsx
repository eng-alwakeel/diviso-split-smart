import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useKPITarget, calculateKPIProgress } from "@/hooks/useAdminKPITargets";
import { Progress } from "@/components/ui/progress";

interface TVKPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: LucideIcon;
  kpiName?: string;
  threshold?: {
    green: number;
    yellow: number;
    invert?: boolean;
  };
  className?: string;
}

export const TVKPICard = ({
  title,
  value,
  unit = '',
  icon: Icon,
  kpiName,
  threshold,
  className
}: TVKPICardProps) => {
  const target = useKPITarget(kpiName || '');
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  
  // Calculate status based on threshold or target
  let status: 'green' | 'yellow' | 'red' = 'green';
  let progress: { percentage: number; status: string } | null = null;

  if (target) {
    progress = calculateKPIProgress(numericValue, target);
    status = progress.status === 'success' ? 'green' : progress.status === 'warning' ? 'yellow' : 'red';
  } else if (threshold) {
    if (threshold.invert) {
      if (numericValue <= threshold.green) status = 'green';
      else if (numericValue <= threshold.yellow) status = 'yellow';
      else status = 'red';
    } else {
      if (numericValue >= threshold.green) status = 'green';
      else if (numericValue >= threshold.yellow) status = 'yellow';
      else status = 'red';
    }
  }

  const statusColors = {
    green: 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
    yellow: 'bg-amber-500/20 border-amber-500 text-amber-400',
    red: 'bg-red-500/20 border-red-500 text-red-400',
  };

  const indicatorColors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div 
      className={cn(
        "relative rounded-2xl border-2 p-6 transition-all duration-500",
        statusColors[status],
        className
      )}
    >
      {/* Status indicator */}
      <div className={cn(
        "absolute top-4 left-4 w-4 h-4 rounded-full animate-pulse",
        indicatorColors[status]
      )} />

      {/* Icon */}
      {Icon && (
        <div className="absolute top-4 right-4 opacity-30">
          <Icon className="w-12 h-12" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white/80 line-clamp-1">{title}</h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white tabular-nums">
            {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
          </span>
          {unit && (
            <span className="text-2xl text-white/60">{unit}</span>
          )}
        </div>

        {/* Target progress */}
        {target && progress && (
          <div className="space-y-2 mt-4">
            <Progress 
              value={Math.min(progress.percentage, 100)} 
              className="h-2 bg-white/20"
            />
            <div className="flex justify-between text-sm text-white/60">
              <span>الهدف: {target.target_value.toLocaleString('ar-SA')}</span>
              <span>{progress.percentage}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
