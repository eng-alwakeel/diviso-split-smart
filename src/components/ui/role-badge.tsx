import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { getRoleBadgeConfig } from "@/hooks/useRoleBadge";
import { useLanguage } from "@/contexts/LanguageContext";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleBadgeProps {
  role: AppRole;
  size?: "sm" | "md" | "lg";
  showEmoji?: boolean;
  className?: string;
}

export function RoleBadge({ 
  role, 
  size = "md", 
  showEmoji = true,
  className 
}: RoleBadgeProps) {
  const config = getRoleBadgeConfig(role);
  const { currentLanguage } = useLanguage();
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const label = currentLanguage === "ar" ? config.label : config.labelEn;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium whitespace-nowrap",
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showEmoji && <span>{config.emoji}</span>}
      <span>{label}</span>
    </span>
  );
}

interface RoleBadgesListProps {
  roles: AppRole[];
  size?: "sm" | "md" | "lg";
  maxVisible?: number;
  className?: string;
}

export function RoleBadgesList({ 
  roles, 
  size = "sm", 
  maxVisible = 3,
  className 
}: RoleBadgesListProps) {
  const visibleRoles = roles.slice(0, maxVisible);
  const remainingCount = roles.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleRoles.map((role) => (
        <RoleBadge key={role} role={role} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
