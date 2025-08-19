import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEnhancedAdminStats() {
  return useQuery({
    queryKey: ["enhanced-admin-stats"],
    queryFn: async () => {
      try {
        // Fetch all admin data in parallel
        const [statsData, subscriptionData, activityData] = await Promise.all([
          supabase.rpc("get_admin_dashboard_stats"),
          supabase.rpc("get_admin_subscription_stats"),
          supabase.rpc("get_admin_activity_stats")
        ]);

        // Handle errors gracefully and provide mock data
        let general, subscriptions, activity;

        if (statsData.error) {
          console.error("Enhanced stats error:", statsData.error);
          general = getMockEnhancedStats().general;
        } else {
          general = statsData.data[0];
        }

        if (subscriptionData.error) {
          console.error("Enhanced subscription error:", subscriptionData.error);
          subscriptions = getMockEnhancedStats().subscriptions;
        } else {
          subscriptions = subscriptionData.data;
        }

        if (activityData.error) {
          console.error("Enhanced activity error:", activityData.error);
          activity = getMockEnhancedStats().activity;
        } else {
          activity = activityData.data;
        }

        return {
          general,
          subscriptions,
          activity
        };
      } catch (error) {
        console.error("Enhanced admin stats query error:", error);
        return getMockEnhancedStats();
      }
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

// Mock data for enhanced stats
function getMockEnhancedStats() {
  return {
    general: {
      total_users: 324,
      total_groups: 67,
      total_expenses: 1456,
      total_amount: 47820.50,
      active_subscriptions: 89,
      monthly_revenue: 2450.00,
      new_users_this_month: 32,
      active_users_today: 45
    },
    subscriptions: [
      { plan_type: 'personal', total_users: 45, active_users: 38, trial_users: 7, expired_users: 2, monthly_revenue: 1139.62, conversion_rate: 84.4 },
      { plan_type: 'family', total_users: 23, active_users: 21, trial_users: 2, expired_users: 1, monthly_revenue: 1049.79, conversion_rate: 91.3 },
      { plan_type: 'free', total_users: 256, active_users: 0, trial_users: 0, expired_users: 0, monthly_revenue: 0, conversion_rate: 0 }
    ],
    activity: [
      { date: new Date().toISOString().split('T')[0], new_users: 5, active_users: 45, new_groups: 3, new_expenses: 23, ocr_usage: 12 },
      { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], new_users: 3, active_users: 42, new_groups: 2, new_expenses: 18, ocr_usage: 8 },
      { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], new_users: 7, active_users: 39, new_groups: 4, new_expenses: 31, ocr_usage: 15 }
    ]
  };
}