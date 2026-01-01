import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type PermissionScope = Database["public"]["Enums"]["permission_scope"];

interface RoleDashboardConfig {
  path: string;
  tabId?: string;
}

// Map roles to their dashboards
const ROLE_DASHBOARDS: Record<AppRole, RoleDashboardConfig> = {
  owner: { path: "/admin-dashboard" },
  admin: { path: "/admin-dashboard" },
  moderator: { path: "/admin-dashboard", tabId: "users" },
  user: { path: "/dashboard" },
  finance_admin: { path: "/admin-dashboard", tabId: "monetization" },
  growth_admin: { path: "/admin-dashboard", tabId: "stats" },
  ads_admin: { path: "/admin-dashboard", tabId: "stats" },
  support_agent: { path: "/support-dashboard" },
  analyst: { path: "/admin-dashboard", tabId: "stats" },
  developer: { path: "/admin-dashboard", tabId: "system" },
};

// Priority order for main dashboard selection
const ROLE_PRIORITY: AppRole[] = [
  "owner",
  "admin",
  "finance_admin",
  "growth_admin",
  "ads_admin",
  "support_agent",
  "analyst",
  "developer",
  "moderator",
  "user",
];

export function useCurrentUserRoles() {
  const rolesQuery = useQuery({
    queryKey: ["current-user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { roles: [], permissions: [] };

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesError) throw rolesError;

      const roles = (rolesData?.map(r => r.role) || []) as AppRole[];

      // Get user permissions
      const { data: permissions, error: permError } = await supabase.rpc(
        "get_user_permissions",
        { _user_id: user.id }
      );

      if (permError) throw permError;

      return {
        roles,
        permissions: (permissions || []) as PermissionScope[],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles = rolesQuery.data?.roles || [];
  const permissions = rolesQuery.data?.permissions || [];

  // Check if user has any admin-level role
  const hasAnyAdminRole = roles.some(
    (role) => role !== "user" && role !== "moderator"
  );

  // Get main dashboard based on highest priority role
  const getMainDashboard = (): RoleDashboardConfig => {
    for (const priorityRole of ROLE_PRIORITY) {
      if (roles.includes(priorityRole) && priorityRole !== "user") {
        return ROLE_DASHBOARDS[priorityRole];
      }
    }
    return { path: "/dashboard" };
  };

  // Check if user has a specific role
  const hasRole = (role: AppRole): boolean => roles.includes(role);

  // Check if user has any of the specified roles
  const hasAnyRole = (checkRoles: AppRole[]): boolean =>
    checkRoles.some((role) => roles.includes(role));

  // Check if user has a specific permission
  const hasPermission = (permission: PermissionScope): boolean =>
    permissions.includes(permission);

  // Get dashboard config for a specific role
  const getDashboardForRole = (role: AppRole): RoleDashboardConfig =>
    ROLE_DASHBOARDS[role];

  // Get all admin roles the user has (excluding user and moderator)
  const adminRoles = roles.filter(
    (role) => role !== "user" && role !== "moderator"
  );

  return {
    roles,
    adminRoles,
    permissions,
    hasAnyAdminRole,
    hasRole,
    hasAnyRole,
    hasPermission,
    getMainDashboard,
    getDashboardForRole,
    isLoading: rolesQuery.isLoading,
    error: rolesQuery.error,
  };
}
