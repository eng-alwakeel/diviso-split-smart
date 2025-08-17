import { useAdminAuth } from "./useAdminAuth";

export interface AdminBadgeConfig {
  badge: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

export function useAdminBadge() {
  const { data: adminData, isLoading } = useAdminAuth();

  const getAdminBadgeConfig = (): AdminBadgeConfig => {
    return {
      badge: "🛡️",
      label: "مدير عام",
      color: "text-white",
      bgColor: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600",
      borderColor: "border-yellow-300",
      glowColor: "shadow-yellow-500/50"
    };
  };

  const badgeConfig = getAdminBadgeConfig();

  return {
    isAdmin: adminData?.isAdmin || false,
    badgeConfig,
    isLoading
  };
}