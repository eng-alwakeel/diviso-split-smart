import { cn } from "@/lib/utils";
import { PlanBadgeConfig } from "@/hooks/usePlanBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/safe-tooltip";

interface PlanBadgeProps {
  config: PlanBadgeConfig;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function PlanBadge({ 
  config, 
  size = "md", 
  showLabel = false, 
  className 
}: PlanBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full font-medium border cursor-default",
            sizeClasses[size],
            config.color,
            config.bgColor,
            "border-current/20",
            className
          )}
        >
          <span>{config.badge}</span>
          {showLabel && <span>{config.label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}