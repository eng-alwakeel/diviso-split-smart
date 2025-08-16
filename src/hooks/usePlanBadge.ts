import { useSubscription } from "./useSubscription";

export type PlanType = "free" | "personal" | "family" | "lifetime";

export interface PlanBadgeConfig {
  badge: string;
  label: string;
  color: string;
  bgColor: string;
}

export function usePlanBadge() {
  const { subscription } = useSubscription();

  const getCurrentPlan = (): PlanType => {
    if (!subscription) return "free";
    
    if (subscription.status === "active" || 
        (subscription.status === "trialing" && new Date(subscription.expires_at) > new Date())) {
      return subscription.plan as PlanType;
    }
    
    return "free";
  };

  const getPlanBadgeConfig = (plan: PlanType): PlanBadgeConfig => {
    const configs: Record<PlanType, PlanBadgeConfig> = {
      free: {
        badge: "مجاني",
        label: "مجاني",
        color: "text-muted-foreground",
        bgColor: "bg-muted"
      },
      personal: {
        badge: "⭐",
        label: "شخصي",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-950"
      },
      family: {
        badge: "👥",
        label: "عائلي",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      lifetime: {
        badge: "👑",
        label: "مدى الحياة",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    };

    return configs[plan];
  };

  const currentPlan = getCurrentPlan();
  const badgeConfig = getPlanBadgeConfig(currentPlan);

  return {
    currentPlan,
    badgeConfig,
    getPlanBadgeConfig,
    isFreePlan: currentPlan === "free"
  };
}