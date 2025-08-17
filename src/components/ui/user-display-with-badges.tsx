import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/ui/plan-badge";
import { AdminBadge } from "@/components/ui/admin-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useAdminBadge } from "@/hooks/useAdminBadge";
import { cn } from "@/lib/utils";

interface UserDisplayWithBadgesProps {
  user: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    phone?: string;
  };
  showAvatar?: boolean;
  showPlanBadge?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  badgeSize?: "sm" | "md" | "lg";
  className?: string;
  isCurrentUser?: boolean;
}

export function UserDisplayWithBadges({
  user,
  showAvatar = true,
  showPlanBadge = true,
  avatarSize = "md",
  badgeSize = "sm",
  className,
  isCurrentUser = false
}: UserDisplayWithBadgesProps) {
  const { badgeConfig: planBadgeConfig } = usePlanBadge();
  const { isAdmin, badgeConfig: adminBadgeConfig } = useAdminBadge();

  const avatarSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const showAdminBadge = isAdmin && isCurrentUser;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar className={avatarSizes[avatarSize]}>
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="text-xs">
            {user.display_name?.charAt(0) || user.phone?.charAt(0) || "؟"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {user.display_name || user.phone || "مستخدم"}
          </span>
          
          <div className="flex items-center gap-1">
            {showAdminBadge && (
              <AdminBadge 
                config={adminBadgeConfig} 
                size={badgeSize}
              />
            )}
            
            {showPlanBadge && (
              <PlanBadge 
                config={planBadgeConfig} 
                size={badgeSize}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}