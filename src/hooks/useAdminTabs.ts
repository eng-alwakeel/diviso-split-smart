import { useMemo } from "react";
import { useCurrentUserRoles } from "./useCurrentUserRoles";
import { Database } from "@/integrations/supabase/types";

type PermissionScope = Database["public"]["Enums"]["permission_scope"];

type TabConfig = {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: string;
  requiredPermissions: PermissionScope[];
};

// تعريف التبويبات والصلاحيات المطلوبة لكل واحد
const ADMIN_TABS: TabConfig[] = [
  { 
    id: "executive", 
    labelEn: "Executive", 
    labelAr: "الملخص التنفيذي",
    icon: "BarChart3",
    requiredPermissions: ["analytics.view"] 
  },
  { 
    id: "funnel", 
    labelEn: "Funnel", 
    labelAr: "الإحالات",
    icon: "Target",
    requiredPermissions: ["rewards.view"] 
  },
  { 
    id: "retention", 
    labelEn: "Retention", 
    labelAr: "الاحتفاظ",
    icon: "Users",
    requiredPermissions: ["analytics.view"] 
  },
  { 
    id: "monetization", 
    labelEn: "Monetization", 
    labelAr: "التسييل",
    icon: "DollarSign",
    requiredPermissions: ["billing.view"] 
  },
  { 
    id: "credits", 
    labelEn: "Credits", 
    labelAr: "الأرصدة",
    icon: "Coins",
    requiredPermissions: ["credits.view", "credits.grant"] 
  },
  { 
    id: "targets", 
    labelEn: "KPI Targets", 
    labelAr: "الأهداف",
    icon: "Target",
    requiredPermissions: ["system.settings"] 
  },
  { 
    id: "permissions", 
    labelEn: "Permissions", 
    labelAr: "الصلاحيات",
    icon: "Lock",
    requiredPermissions: ["users.edit", "users.ban"] 
  },
  { 
    id: "management", 
    labelEn: "Management", 
    labelAr: "الإدارة",
    icon: "Users",
    requiredPermissions: ["users.view"] 
  },
];

export function useAdminTabs() {
  const { permissions, hasRole, isLoading } = useCurrentUserRoles();
  
  const { allowedTabs, defaultTab, canManageAdmins, canAccessSupport } = useMemo(() => {
    // owner و admin يرون كل شيء
    const isOwnerOrAdmin = hasRole("owner") || hasRole("admin");
    
    const allowed = ADMIN_TABS.filter(tab => {
      if (isOwnerOrAdmin) return true;
      // التحقق من وجود أي صلاحية مطلوبة
      return tab.requiredPermissions.some(perm => permissions.includes(perm));
    });
    
    // التبويب الافتراضي هو الأول من المسموح بها
    const defaultTabId = allowed[0]?.id || "executive";
    
    // صلاحيات خاصة للأزرار
    const canManage = isOwnerOrAdmin || permissions.includes("users.edit");
    const canSupport = isOwnerOrAdmin || 
                       hasRole("support_agent") || 
                       permissions.includes("users.view");
    
    return { 
      allowedTabs: allowed, 
      defaultTab: defaultTabId,
      canManageAdmins: canManage,
      canAccessSupport: canSupport
    };
  }, [permissions, hasRole]);
  
  return { 
    allowedTabs, 
    defaultTab, 
    canManageAdmins,
    canAccessSupport,
    isLoading,
    allTabs: ADMIN_TABS
  };
}
