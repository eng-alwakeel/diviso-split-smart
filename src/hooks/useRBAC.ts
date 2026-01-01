import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type PermissionScope = Database["public"]["Enums"]["permission_scope"];

// Role labels in Arabic
export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "المالك",
  admin: "مدير عام",
  moderator: "مشرف",
  user: "مستخدم",
  finance_admin: "مدير مالي",
  growth_admin: "مدير النمو",
  ads_admin: "مدير الإعلانات",
  support_agent: "خدمة العملاء",
  analyst: "محلل",
  developer: "مطور",
};

// Role descriptions in Arabic
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  owner: "كل الصلاحيات بدون استثناء",
  admin: "إدارة شاملة للتطبيق",
  moderator: "إدارة المحتوى والمستخدمين",
  user: "مستخدم عادي",
  finance_admin: "إدارة الفواتير والاشتراكات",
  growth_admin: "إدارة الإحالات والترويج",
  ads_admin: "إدارة الإعلانات والشراكات",
  support_agent: "دعم العملاء والتذاكر",
  analyst: "عرض التقارير والإحصائيات",
  developer: "إدارة Edge Functions والـ Debug",
};

// Permission labels in Arabic
export const PERMISSION_LABELS: Record<PermissionScope, string> = {
  "users.view": "عرض المستخدمين",
  "users.edit": "تعديل المستخدمين",
  "users.ban": "حظر المستخدمين",
  "users.delete": "حذف المستخدمين",
  "billing.view": "عرض الفواتير",
  "billing.refund": "إجراء المرتجعات",
  "billing.cancel_subscription": "إلغاء الاشتراكات",
  "pricing.view": "عرض التسعير",
  "pricing.edit": "تعديل التسعير",
  "credits.view": "عرض الرصيد",
  "credits.grant": "منح رصيد",
  "credits.deduct": "خصم رصيد",
  "rewards.view": "عرض المكافآت",
  "rewards.manage_campaigns": "إدارة حملات المكافآت",
  "rewards.grant_manual": "منح مكافآت يدوية",
  "ads.view": "عرض الإعلانات",
  "ads.manage_partners": "إدارة الشركاء",
  "ads.manage_campaigns": "إدارة حملات الإعلانات",
  "analytics.view": "عرض التحليلات",
  "analytics.export": "تصدير البيانات",
  "system.feature_flags": "إدارة الميزات",
  "system.logs": "عرض السجلات",
  "system.settings": "إعدادات النظام",
};

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!userId,
  });
}

export function useUserPermissions(userId?: string) {
  return useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase.rpc("get_user_permissions", {
        _user_id: userId,
      });

      if (error) throw error;
      return (data as PermissionScope[]) || [];
    },
    enabled: !!userId,
  });
}

export function useCheckPermission(permission: PermissionScope) {
  return useQuery({
    queryKey: ["check-permission", permission],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: user.id,
        _permission: permission,
      });

      if (error) throw error;
      return data as boolean;
    },
  });
}

export function useAllRolesWithPermissions() {
  return useQuery({
    queryKey: ["all-roles-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, permission")
        .order("role");

      if (error) throw error;
      
      // Group permissions by role
      const roleMap = new Map<AppRole, PermissionScope[]>();
      
      for (const item of data || []) {
        const role = item.role as AppRole;
        const permission = item.permission as PermissionScope;
        
        if (!roleMap.has(role)) {
          roleMap.set(role, []);
        }
        roleMap.get(role)!.push(permission);
      }
      
      return roleMap;
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-roles", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["roles-stats"] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-roles", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["roles-stats"] });
    },
  });
}

export function useRolesStats() {
  return useQuery({
    queryKey: ["roles-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role");

      if (error) throw error;

      // Count users per role
      const counts = new Map<AppRole, number>();
      for (const item of data || []) {
        const role = item.role as AppRole;
        counts.set(role, (counts.get(role) || 0) + 1);
      }

      return counts;
    },
  });
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      // Get all users with their roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Group by user_id
      const userRolesMap = new Map<string, AppRole[]>();
      for (const item of roles || []) {
        const userId = item.user_id;
        const role = item.role as AppRole;
        
        if (!userRolesMap.has(userId)) {
          userRolesMap.set(userId, []);
        }
        userRolesMap.get(userId)!.push(role);
      }

      return userRolesMap;
    },
  });
}
