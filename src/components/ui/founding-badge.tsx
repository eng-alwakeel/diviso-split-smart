import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/safe-tooltip";
import { useTranslation } from "react-i18next";

interface FoundingBadgeProps {
  userNumber: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
  md: "px-2 py-1 text-xs gap-1",
  lg: "px-3 py-1.5 text-sm gap-1.5"
};

const iconSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-4 w-4"
};

export function FoundingBadge({ 
  userNumber, 
  size = "md", 
  showTooltip = true,
  className 
}: FoundingBadgeProps) {
  const { t } = useTranslation('auth');
  
  const badge = (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium",
      "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
      "text-white border border-amber-300/50",
      "shadow-sm",
      sizeClasses[size],
      className
    )}>
      <Star className={cn("fill-current", iconSizes[size])} />
      <span>#{userNumber}</span>
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('founding_program.founding_user_tooltip', { number: userNumber })}</p>
      </TooltipContent>
    </Tooltip>
  );
}
