import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReferralAnalytics {
  id: string;
  date: string;
  invites_sent: number;
  invites_accepted: number;
  conversion_rate: number;
  created_at: string;
}

export interface ReferralSummary {
  total_sent: number;
  total_accepted: number;
  overall_conversion_rate: number;
  best_day: ReferralAnalytics | null;
  recent_trend: 'up' | 'down' | 'stable';
}

export function useReferralAnalytics() {
  const [analytics, setAnalytics] = useState<ReferralAnalytics[]>([]);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async (days: number = 30) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("referral_analytics")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("date", { ascending: false });

      if (error) throw error;

      setAnalytics(data || []);

      // حساب الملخص
      if (data && data.length > 0) {
        const totalSent = data.reduce((sum, item) => sum + item.invites_sent, 0);
        const totalAccepted = data.reduce((sum, item) => sum + item.invites_accepted, 0);
        const overallRate = totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0;
        
        const bestDay = data.reduce((best, current) => 
          current.conversion_rate > (best?.conversion_rate || 0) ? current : best
        );

        // حساب الاتجاه
        const recentData = data.slice(0, 7);
        const olderData = data.slice(7, 14);
        const recentAvg = recentData.length > 0 ? 
          recentData.reduce((sum, item) => sum + item.conversion_rate, 0) / recentData.length : 0;
        const olderAvg = olderData.length > 0 ? 
          olderData.reduce((sum, item) => sum + item.conversion_rate, 0) / olderData.length : 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (recentAvg > olderAvg + 5) trend = 'up';
        else if (recentAvg < olderAvg - 5) trend = 'down';

        setSummary({
          total_sent: totalSent,
          total_accepted: totalAccepted,
          overall_conversion_rate: overallRate,
          best_day: bestDay,
          recent_trend: trend
        });
      }
    } catch (error) {
      console.error("Error fetching referral analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getChartData = useCallback(() => {
    return analytics.map(item => ({
      date: new Date(item.date).toLocaleDateString('ar-SA', { 
        month: 'short', 
        day: 'numeric' 
      }),
      sent: item.invites_sent,
      accepted: item.invites_accepted,
      rate: item.conversion_rate
    }));
  }, [analytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    summary,
    loading,
    getChartData,
    refresh: (days?: number) => fetchAnalytics(days)
  };
}