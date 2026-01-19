import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUsageCredits } from "@/hooks/useUsageCredits";

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
  district?: string;
  latitude?: number;
  longitude?: number;
  categories?: string[];
}

export function useRecommendations(groupId?: string) {
  const { t } = useTranslation("recommendations");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { checkCredits, consumeCredits } = useUsageCredits();
  const [currentRecommendation, setCurrentRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingExpenseRecommendation, setPendingExpenseRecommendation] = useState<Recommendation | null>(null);

  // Generate a new recommendation
  const generateRecommendation = useCallback(async (params: GenerateRecommendationParams) => {
    // Check credits before generating recommendation
    const creditCheck = await checkCredits('recommendation');
    if (!creditCheck.canPerform) {
      toast({
        title: t('errors.insufficient_credits', 'رصيد النقاط غير كافي'),
        description: t('errors.need_credits', 'تحتاج نقاط لطلب توصية'),
        variant: 'destructive'
      });
      return { blocked: true, needsCredits: true };
    }

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
          district: params.district,
          latitude: params.latitude,
          longitude: params.longitude,
          categories: params.categories,
          current_time: new Date().toISOString(),
          tz_offset_minutes: new Date().getTimezoneOffset(),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.recommendation) {
        // Consume credits after successful recommendation
        await consumeCredits('recommendation');
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
  }, [groupId, checkCredits, consumeCredits, t]);

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
      // Store the recommendation and signal that group selection is needed
      setPendingExpenseRecommendation(recommendation);
      return { needsGroupSelection: true };
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
    setPendingExpenseRecommendation(null);

    toast({
      title: t("expense_prefilled"),
      description: t("expense_prefilled_description"),
    });
    
    return { needsGroupSelection: false };
  }, [groupId, navigate, t, trackEvent]);

  // Complete expense addition with selected group
  const completeAddAsExpense = useCallback(async (targetGroupId: string) => {
    if (!pendingExpenseRecommendation) return;
    
    await addAsExpense(pendingExpenseRecommendation, targetGroupId);
    setPendingExpenseRecommendation(null);
  }, [pendingExpenseRecommendation, addAsExpense]);

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
    completeAddAsExpense,
    pendingExpenseRecommendation,
    clearPendingExpense: () => setPendingExpenseRecommendation(null),
    openExternalLink,
    trackEvent: trackEvent.mutate,
  };
}
