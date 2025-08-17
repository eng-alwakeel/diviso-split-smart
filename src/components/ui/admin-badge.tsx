import { cn } from "@/lib/utils";
import { AdminBadgeConfig } from "@/hooks/useAdminBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminBadgeProps {
  config: AdminBadgeConfig;
  size?: "sm" | "md" | "lg";
  style?: "compact" | "full";
  className?: string;
}

export function AdminBadge({ 
  config, 
  size = "sm", 
  style = "compact",
  className 
}: AdminBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-semibold border cursor-default shadow-sm",
              sizeClasses[size],
              config.color,
              config.bgColor,
              "border-amber-200 dark:border-amber-800",
              className
            )}
          >
            <span>{config.badge}</span>
            {style === "full" && <span>{config.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}