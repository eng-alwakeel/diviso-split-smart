import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessMetrics {
  // Revenue Metrics
  monthly_revenue: number;
  revenue_growth_rate: number;
  arpu: number; // Average Revenue Per User
  
  // Conversion Metrics
  conversion_rate: number;
  churn_rate: number;
  retention_rate: number;
  
  // Activity Health
  active_paying_users: number;
  active_groups_with_expenses: number;
  avg_expenses_per_group: number;
  
  // Plan Analysis
  plan_performance: Array<{
    plan: string;
    users: number;
    revenue: number;
    roi: number;
  }>;
  
  // Growth Indicators
  upgrade_candidates: number;
  at_risk_users: number;
  
  // Comparative Data
  previous_month_revenue: number;
  previous_month_users: number;
}

export function useBusinessMetrics() {
  return useQuery({
    queryKey: ["business-metrics"],
    queryFn: async () => {
      // Get current revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .rpc("get_admin_subscription_stats");
      
      if (revenueError) throw revenueError;

      // Get user activity data
      const { data: activityData, error: activityError } = await supabase
        .rpc("get_admin_activity_stats");
        
      if (activityError) throw activityError;

      // Calculate business metrics
      const totalRevenue = revenueData?.reduce((sum: number, plan: any) => 
        sum + (plan.monthly_revenue || 0), 0) || 0;
      
      const totalActiveUsers = revenueData?.reduce((sum: number, plan: any) => 
        sum + (plan.active_users || 0), 0) || 0;
      
      const totalTrialUsers = revenueData?.reduce((sum: number, plan: any) => 
        sum + (plan.trial_users || 0), 0) || 0;

      const conversionRate = totalTrialUsers > 0 ? 
        (totalActiveUsers / (totalActiveUsers + totalTrialUsers)) * 100 : 0;

      // Get additional stats
      const { data: generalStats, error: generalError } = await supabase
        .rpc("get_admin_dashboard_stats");
        
      if (generalError) throw generalError;

      const arpu = totalActiveUsers > 0 ? totalRevenue / totalActiveUsers : 0;
      
      // Mock some metrics that would require more complex queries
      const metrics: BusinessMetrics = {
        monthly_revenue: totalRevenue,
        revenue_growth_rate: 15.2, // Would calculate from historical data
        arpu: arpu,
        conversion_rate: conversionRate,
        churn_rate: 5.1, // Would calculate from subscription cancellations
        retention_rate: 94.9,
        active_paying_users: totalActiveUsers,
        active_groups_with_expenses: generalStats?.[0]?.active_users_today || 0,
        avg_expenses_per_group: generalStats?.[0]?.total_expenses > 0 ? 
          (generalStats[0].total_amount / generalStats[0].total_expenses) : 0,
        plan_performance: revenueData?.map((plan: any) => ({
          plan: plan.plan_type,
          users: plan.active_users || 0,
          revenue: plan.monthly_revenue || 0,
          roi: plan.active_users > 0 ? (plan.monthly_revenue / plan.active_users) : 0
        })) || [],
        upgrade_candidates: Math.floor(totalTrialUsers * 0.3), // 30% of trial users
        at_risk_users: Math.floor(totalActiveUsers * 0.05), // 5% at risk
        previous_month_revenue: totalRevenue * 0.87, // Mock previous month
        previous_month_users: Math.floor(totalActiveUsers * 0.92)
      };

      return metrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRevenueInsights() {
  return useQuery({
    queryKey: ["revenue-insights"],
    queryFn: async () => {
      // This would contain more detailed revenue analysis
      return {
        top_revenue_sources: [
          { source: "Family Plans", revenue: 2450, percentage: 45 },
          { source: "Personal Plans", revenue: 1890, percentage: 35 },
          { source: "Lifetime Plans", revenue: 1080, percentage: 20 }
        ],
        growth_opportunities: [
          { opportunity: "Trial to Paid Conversion", potential: "+25% revenue" },
          { opportunity: "Feature Usage Optimization", potential: "+15% retention" },
          { opportunity: "Price Optimization", potential: "+10% ARPU" }
        ]
      };
    },
    staleTime: 10 * 60 * 1000
  });
}