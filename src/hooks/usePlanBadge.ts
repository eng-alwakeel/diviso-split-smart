import { useSubscription } from "./useSubscription";

export type PlanType = "free" | "starter" | "pro" | "max" | "personal" | "family" | "lifetime";

export interface PlanBadgeConfig {
  badge: string;
  label: string;
  color: string;
  bgColor: string;
}

// دالة لاستخراج اسم الخطة الأساسي من الاسم الكامل
const getPlanBase = (plan: string): string => {
  return plan
    .replace('_monthly', '')
    .replace('_yearly', '')
    .toLowerCase();
};

// خريطة للتوافق مع الخطط القديمة
const legacyPlanMap: Record<string, string> = {
  personal: 'starter',
  family: 'pro',
  lifetime: 'max',
};

export function usePlanBadge() {
  const { subscription } = useSubscription();

  const getCurrentPlan = (): PlanType => {
    if (!subscription) return "free";
    
    if (subscription.status === "active" || 
        (subscription.status === "trialing" && new Date(subscription.expires_at) > new Date())) {
      const planBase = getPlanBase(subscription.plan);
      // تحويل الخطط القديمة للجديدة
      const normalizedPlan = legacyPlanMap[planBase] || planBase;
      return normalizedPlan as PlanType;
    }
    
    return "free";
  };

  const getPlanBadgeConfig = (plan: PlanType): PlanBadgeConfig => {
    // تحويل الخطط القديمة للجديدة
    const normalizedPlan = legacyPlanMap[plan] || plan;
    
    const configs: Record<string, PlanBadgeConfig> = {
      free: {
        badge: "🆓",
        label: "Free",
        color: "text-muted-foreground",
        bgColor: "bg-muted"
      },
      starter: {
        badge: "⚡",
        label: "Starter",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950"
      },
      pro: {
        badge: "💎",
        label: "Pro",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      max: {
        badge: "👑",
        label: "Max",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    };

    return configs[normalizedPlan] || configs.free;
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