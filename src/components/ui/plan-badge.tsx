import { cn } from "@/lib/utils";
import { PlanBadgeConfig } from "@/hooks/usePlanBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
            "inline-flex items-center justify-center rounded-md font-medium transition-colors",
            config.color,
            config.bgColor,
            sizeClasses[size],
            className
          )}
        >
          {config.badge}
          {showLabel && <span className="mr-1">{config.label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
