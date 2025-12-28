import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface Recommendation {
  id: string;
  name: string;
  name_ar?: string | null;
  category?: string | null;
  rating?: number | null;
  price_range?: string | null;
  estimated_price?: number | null;
  currency?: string | null;
  relevance_reason?: string | null;
  relevance_reason_ar?: string | null;
  is_partner?: boolean | null;
  affiliate_url?: string | null;
  place_id?: string | null;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  } | null;
}

interface GenerateRecommendationParams {
  trigger: "planning" | "meal_time" | "post_expense" | "end_of_day";
  groupId?: string;
  city?: string;
  categories?: string[];
}

export function useRecommendations(groupId?: string) {
  const { t } = useTranslation("recommendations");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentRecommendation, setCurrentRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a new recommendation
  const generateRecommendation = useCallback(async (params: GenerateRecommendationParams) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-recommendation", {
        body: {
          trigger: params.trigger,
          group_id: params.groupId || groupId,
          city: params.city,
          categories: params.categories,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.recommendation) {
        setCurrentRecommendation(data.recommendation);
        return data.recommendation;
      }

      return null;
    } catch (error) {
      console.error("Failed to generate recommendation:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Track recommendation event
  const trackEvent = useMutation({
    mutationFn: async ({ 
      recommendationId, 
      eventType, 
      metadata 
    }: { 
      recommendationId: string; 
      eventType: "shown" | "clicked" | "dismissed" | "converted";
      metadata?: Record<string, any>;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("track-recommendation-event", {
        body: {
          recommendation_id: recommendationId,
          event_type: eventType,
          metadata,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
  });

  // Accept recommendation (mark as clicked)
  const acceptRecommendation = useCallback(async (recommendation: Recommendation) => {
    await trackEvent.mutateAsync({
      recommendationId: recommendation.id,
      eventType: "clicked",
    });

    // Open affiliate URL if available
    if (recommendation.affiliate_url) {
      window.open(recommendation.affiliate_url, "_blank");
    } else if (recommendation.location?.lat && recommendation.location?.lng) {
      // Open in Google Maps
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${recommendation.location.lat},${recommendation.location.lng}`;
      window.open(mapsUrl, "_blank");
    }
  }, [trackEvent]);

  // Dismiss recommendation
  const dismissRecommendation = useCallback(async (recommendationId: string) => {
    await trackEvent.mutateAsync({
      recommendationId,
      eventType: "dismissed",
    });
    setCurrentRecommendation(null);
  }, [trackEvent]);

  // Add recommendation as expense
  const addAsExpense = useCallback(async (recommendation: Recommendation, targetGroupId?: string) => {
    const gId = targetGroupId || groupId;
    if (!gId) {
      toast({
        title: t("errors.no_group"),
        variant: "destructive",
      });
      return;
    }

    // Track conversion
    await trackEvent.mutateAsync({
      recommendationId: recommendation.id,
      eventType: "converted",
      metadata: { group_id: gId },
    });

    // Navigate to add expense with pre-filled data
    navigate(`/groups/${gId}/add-expense`, {
      state: {
        prefill: {
          description: recommendation.name_ar || recommendation.name,
          amount: recommendation.estimated_price,
          currency: recommendation.currency || "SAR",
          category: recommendation.category,
          note: t("from_recommendation"),
        },
      },
    });

    setCurrentRecommendation(null);

    toast({
      title: t("expense_prefilled"),
      description: t("expense_prefilled_description"),
    });
  }, [groupId, navigate, t, trackEvent]);

  // Open external location (Google Maps or affiliate URL)
  const openExternalLink = useCallback(async (recommendation: Recommendation) => {
    await acceptRecommendation(recommendation);
  }, [acceptRecommendation]);

  return {
    currentRecommendation,
    isLoading,
    generateRecommendation,
    acceptRecommendation,
    dismissRecommendation,
    addAsExpense,
    openExternalLink,
    trackEvent: trackEvent.mutate,
  };
}
