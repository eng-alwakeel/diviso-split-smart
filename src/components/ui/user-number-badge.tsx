import { cn } from "@/lib/utils";
import { FoundingBadge } from "./founding-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/safe-tooltip";
import { useTranslation } from "react-i18next";

interface UserNumberBadgeProps {
  userNumber: number;
  isFoundingUser: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm"
};

export function UserNumberBadge({ 
  userNumber, 
  isFoundingUser,
  size = "md", 
  showTooltip = true,
  className 
}: UserNumberBadgeProps) {
  const { t } = useTranslation('settings');
  
  // إذا كان مستخدم مؤسس، استخدم الشارة الذهبية
  if (isFoundingUser && userNumber <= 1000) {
    return (
      <FoundingBadge 
        userNumber={userNumber} 
        size={size} 
        showTooltip={showTooltip}
        className={className}
      />
    );
  }

  // شارة المستخدم العادي
  const badge = (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium",
      "bg-muted text-muted-foreground border border-border",
      sizeClasses[size],
      className
    )}>
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
        <p>{t('profile.user_number_tooltip', { number: userNumber })}</p>
      </TooltipContent>
    </Tooltip>
  );
}
