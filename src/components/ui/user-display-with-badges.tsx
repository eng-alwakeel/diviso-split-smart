import { cn } from "@/lib/utils";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useAdminBadge } from "@/hooks/useAdminBadge";
import { PlanBadge } from "@/components/ui/plan-badge";
import { AdminBadge } from "@/components/ui/admin-badge";

interface UserDisplayWithBadgesProps {
  userId?: string;
  displayName: string;
  isCurrentUser?: boolean;
  className?: string;
  badgeSize?: "sm" | "md" | "lg";
  showPlanBadge?: boolean;
  showAdminBadge?: boolean;
}

export function UserDisplayWithBadges({
  userId,
  displayName,
  isCurrentUser = false,
  className,
  badgeSize = "sm",
  showPlanBadge = true,
  showAdminBadge = true
}: UserDisplayWithBadgesProps) {
  const { badgeConfig: planBadgeConfig } = usePlanBadge();
  const { shouldShowBadge: shouldShowAdminBadge, badgeConfig: adminBadgeConfig } = useAdminBadge();

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="font-medium">
        {displayName}
        {isCurrentUser && (
          <span className="text-muted-foreground text-sm mr-1"> (أنت)</span>
        )}
      </span>
      
      <div className="flex items-center gap-1">
        {showAdminBadge && shouldShowAdminBadge && (
          <AdminBadge 
            config={adminBadgeConfig} 
            size={badgeSize}
            style="compact"
          />
        )}
        
        {showPlanBadge && (
          <PlanBadge 
            config={planBadgeConfig} 
            size={badgeSize}
            showLabel={false}
          />
        )}
      </div>
    </div>
  );
}