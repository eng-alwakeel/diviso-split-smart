import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface RecommendationSettings {
  id: string;
  user_id: string | null;
  enabled: boolean | null;
  preferred_categories: string[] | null;
  blocked_categories: string[] | null;
  max_per_day: number | null;
  notifications_today: number | null;
  last_notification_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useRecommendationSettings() {
  const { t } = useTranslation("recommendations");
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["recommendation-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_recommendation_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // If no settings exist, create default settings
      if (!data) {
        const defaultSettings = {
          user_id: user.id,
          enabled: true,
          preferred_categories: ["food", "accommodation", "cafe", "shopping"],
          max_per_day: 5,
        };

        const { data: newData, error: insertError } = await supabase
          .from("user_recommendation_settings")
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as RecommendationSettings;
      }

      return data as RecommendationSettings;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<RecommendationSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_recommendation_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendation-settings"] });
    },
    onError: (error) => {
      console.error("Failed to update settings:", error);
      toast({
        title: t("settings.error"),
        description: t("settings.error_description"),
        variant: "destructive",
      });
    },
  });

  const updateEnabled = (enabled: boolean) => {
    updateSettingsMutation.mutate({ enabled });
  };

  const updateMaxPerDay = (max: number) => {
    updateSettingsMutation.mutate({ max_per_day: max });
  };

  const updatePreferredCategories = (categories: string[]) => {
    updateSettingsMutation.mutate({ preferred_categories: categories });
  };

  const updateMealTimeAlerts = (enabled: boolean) => {
    // meal_time_alerts is controlled via 'enabled' for now
    updateSettingsMutation.mutate({ enabled });
  };

  const checkDailyLimit = (): boolean => {
    if (!settings) return true;
    
    const today = new Date().toISOString().split("T")[0];
    const lastNotificationDate = settings.last_notification_at?.split("T")[0];
    
    if (lastNotificationDate !== today) {
      return true; // New day, reset count
    }
    
    return (settings.notifications_today || 0) < (settings.max_per_day || 5);
  };

  return {
    settings,
    isLoading,
    error,
    isEnabled: settings?.enabled ?? true,
    updateEnabled,
    updateMaxPerDay,
    updatePreferredCategories,
    updateMealTimeAlerts,
    checkDailyLimit,
  };
}
