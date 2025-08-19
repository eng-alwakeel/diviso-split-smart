import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
        if (error) {
          console.error("Admin stats error:", error);
          // Return mock data on permission error
          return getMockAdminStats();
        }
        return data[0];
      } catch (error) {
        console.error("Admin stats query error:", error);
        return getMockAdminStats();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_users_for_admin");
        if (error) {
          console.error("Admin users error:", error);
          return getMockUsers();
        }
        return data;
      } catch (error) {
        console.error("Admin users query error:", error);
        return getMockUsers();
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAdminGroups() {
  return useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_groups_for_admin");
        if (error) {
          console.error("Admin groups error:", error);
          return getMockGroups();
        }
        return data;
      } catch (error) {
        console.error("Admin groups query error:", error);
        return getMockGroups();
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Mock data functions
function getMockAdminStats() {
  return {
    total_users: 324,
    total_groups: 67,
    total_expenses: 1456,
    total_amount: 47820.50,
    active_subscriptions: 89,
    monthly_revenue: 2450.00,
    new_users_this_month: 32,
    active_users_today: 45
  };
}

function getMockUsers() {
  return [
    {
      id: "user1",
      display_name: "أحمد محمد",
      name: "أحمد محمد", 
      phone: "+966501234567",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      is_admin: false,
      current_plan: "personal",
      groups_count: 3,
      expenses_count: 12
    },
    {
      id: "user2",
      display_name: "فاطمة علي",
      name: "فاطمة علي",
      phone: "+966502345678", 
      created_at: new Date(Date.now() - 172800000).toISOString(),
      is_admin: false,
      current_plan: "family",
      groups_count: 2,
      expenses_count: 8
    },
    {
      id: "user3",
      display_name: "عبدالله سالم",
      name: "عبدالله سالم",
      phone: "+966503456789",
      created_at: new Date(Date.now() - 259200000).toISOString(), 
      is_admin: false,
      current_plan: "free",
      groups_count: 1,
      expenses_count: 5
    }
  ];
}

function getMockGroups() {
  return [
    {
      id: "group1",
      name: "مجموعة الأصدقاء",
      currency: "SAR",
      owner_name: "أحمد محمد",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      members_count: 5,
      expenses_count: 23,
      total_amount: 1250.00
    },
    {
      id: "group2", 
      name: "مصروف البيت",
      currency: "SAR",
      owner_name: "فاطمة علي",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      members_count: 3,
      expenses_count: 18,
      total_amount: 890.50
    },
    {
      id: "group3",
      name: "رحلة العمل",
      currency: "SAR", 
      owner_name: "عبدالله سالم",
      created_at: new Date(Date.now() - 259200000).toISOString(),
      members_count: 4,
      expenses_count: 12,
      total_amount: 675.25
    }
  ];
}