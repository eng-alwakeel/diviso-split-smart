import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEnhancedAdminStats() {
  return useQuery({
    queryKey: ["enhanced-admin-stats"],
    queryFn: async () => {
      // Fetch all admin data in parallel
      const [statsData, subscriptionData, activityData] = await Promise.all([
        supabase.rpc("get_admin_dashboard_stats"),
        supabase.rpc("get_admin_subscription_stats"),
        supabase.rpc("get_admin_activity_stats")
      ]);

      if (statsData.error) throw statsData.error;
      if (subscriptionData.error) throw subscriptionData.error;
      if (activityData.error) throw activityData.error;

      return {
        general: statsData.data[0],
        subscriptions: subscriptionData.data,
        activity: activityData.data
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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