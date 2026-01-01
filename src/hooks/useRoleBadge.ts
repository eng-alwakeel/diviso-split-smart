import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface RoleBadgeConfig {
  emoji: string;
  label: string;
  labelEn: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const ROLE_BADGE_CONFIG: Record<AppRole, RoleBadgeConfig> = {
  owner: {
    emoji: "👑",
    label: "المالك",
    labelEn: "Owner",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-500/30",
  },
  admin: {
    emoji: "🛡️",
    label: "مدير عام",
    labelEn: "Admin",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/30",
  },
  moderator: {
    emoji: "👮",
    label: "مشرف",
    labelEn: "Moderator",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/30",
  },
  user: {
    emoji: "👤",
    label: "مستخدم",
    labelEn: "User",
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
    borderColor: "border-border",
  },
  finance_admin: {
    emoji: "💰",
    label: "مدير مالي",
    labelEn: "Finance",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  growth_admin: {
    emoji: "📈",
    label: "مدير نمو",
    labelEn: "Growth",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-500/30",
  },
  ads_admin: {
    emoji: "📢",
    label: "مدير إعلانات",
    labelEn: "Ads",
    bgColor: "bg-pink-500/10",
    textColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-500/30",
  },
  support_agent: {
    emoji: "🎧",
    label: "دعم عملاء",
    labelEn: "Support",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-500/30",
  },
  analyst: {
    emoji: "📊",
    label: "محلل",
    labelEn: "Analyst",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-500/30",
  },
  developer: {
    emoji: "💻",
    label: "مطور",
    labelEn: "Developer",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-500/30",
  },
};

export function useRoleBadge(role: AppRole) {
  return ROLE_BADGE_CONFIG[role];
}

export function getRoleBadgeConfig(role: AppRole): RoleBadgeConfig {
  return ROLE_BADGE_CONFIG[role];
}
