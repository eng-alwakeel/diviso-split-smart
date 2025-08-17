import { useAdminAuth } from "./useAdminAuth";

export interface AdminBadgeConfig {
  badge: string;
  label: string;
  color: string;
  bgColor: string;
}

export function useAdminBadge() {
  const { data: adminData, isLoading } = useAdminAuth();

  const getAdminBadgeConfig = (): AdminBadgeConfig => {
    return {
      badge: "👑",
      label: "أدمن",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50"
    };
  };

  const badgeConfig = getAdminBadgeConfig();

  return {
    isAdmin: adminData?.isAdmin || false,
    isLoading,
    badgeConfig,
    shouldShowBadge: !isLoading && adminData?.isAdmin
  };
}