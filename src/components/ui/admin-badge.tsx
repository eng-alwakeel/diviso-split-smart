import { cn } from "@/lib/utils";
import { AdminBadgeConfig } from "@/hooks/useAdminBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield } from "lucide-react";

interface AdminBadgeProps {
  config: AdminBadgeConfig;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function AdminBadge({ 
  config, 
  size = "md", 
  showLabel = false, 
  className 
}: AdminBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-bold border cursor-default",
              "shadow-lg hover:shadow-xl transition-all duration-300",
              "animate-pulse hover:animate-none",
              sizeClasses[size],
              config.color,
              config.bgColor,
              config.borderColor,
              `hover:${config.glowColor}`,
              className
            )}
          >
            <Shield className={iconSizes[size]} />
            {showLabel && <span>{config.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}