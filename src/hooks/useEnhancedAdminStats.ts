import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEnhancedAdminStats() {
  return useQuery({
    queryKey: ["enhanced-admin-stats"],
    queryFn: async () => {
      const [statsData, subscriptionData, activityData] = await Promise.all([
        supabase.rpc("get_admin_dashboard_stats"),
        supabase.rpc("get_admin_subscription_stats"),
        supabase.rpc("get_admin_activity_stats")
      ]);

      if (statsData.error) {
        console.error("Enhanced stats error:", statsData.error);
        throw new Error(`فشل تحميل الإحصائيات: ${statsData.error.message}`);
      }

      if (subscriptionData.error) {
        console.error("Enhanced subscription error:", subscriptionData.error);
        throw new Error(`فشل تحميل بيانات الاشتراكات: ${subscriptionData.error.message}`);
      }

      if (activityData.error) {
        console.error("Enhanced activity error:", activityData.error);
        throw new Error(`فشل تحميل بيانات النشاط: ${activityData.error.message}`);
      }

      return {
        general: statsData.data[0],
        subscriptions: subscriptionData.data,
        activity: activityData.data
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useAdminUserActions() {
  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    const { data, error } = await supabase.rpc("admin_toggle_user_admin", {
      p_user_id: userId,
      p_is_admin: isAdmin
    });
    
    if (error) throw error;
    return data;
  };

  const deleteGroup = async (groupId: string) => {
    const { data, error } = await supabase.rpc("admin_delete_group", {
      p_group_id: groupId
    });
    
    if (error) throw error;
    return data;
  };

  return { toggleUserAdmin, deleteGroup };
}
