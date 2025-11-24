import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      if (error) {
        console.error("Admin stats error:", error);
        throw new Error(`فشل تحميل إحصائيات الإدارة: ${error.message}`);
      }
      return data[0];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_for_admin");
      if (error) {
        console.error("Admin users error:", error);
        throw new Error(`فشل تحميل بيانات المستخدمين: ${error.message}`);
      }
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

export function useAdminGroups() {
  return useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_groups_for_admin");
      if (error) {
        console.error("Admin groups error:", error);
        throw new Error(`فشل تحميل بيانات المجموعات: ${error.message}`);
      }
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}
