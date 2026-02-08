import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface PlanDayActivity {
  id: string;
  plan_day_id: string;
  title: string;
  description: string | null;
  time_slot: "morning" | "afternoon" | "evening" | "any";
  status: "idea" | "proposed" | "locked";
  estimated_cost: number | null;
  currency: string;
  participant_scope: "all" | "custom";
  participant_user_ids: string[] | null;
  created_by: "ai" | "user";
  linked_expense_id: string | null;
  linked_vote_id: string | null;
  created_at: string;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  date: string;
  day_index: number;
  created_at: string;
  activities: PlanDayActivity[];
}

export interface AddActivityData {
  title: string;
  description?: string;
  time_slot: string;
  estimated_cost?: number | null;
  currency?: string;
  participant_scope?: string;
  participant_user_ids?: string[];
}

export function usePlanItinerary(planId: string | undefined) {
  const { toast } = useToast();
  const { t } = useTranslation("plans");
  const queryClient = useQueryClient();
  const queryKey = ["plan-itinerary", planId];

  // Fetch days with activities
  const daysQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!planId) return [];

      const { data: days, error } = await supabase
        .from("plan_days")
        .select("*")
        .eq("plan_id", planId)
        .order("day_index", { ascending: true });

      if (error) throw error;
      if (!days || days.length === 0) return [];

      const dayIds = days.map((d) => d.id);

      const { data: activities, error: actError } = await supabase
        .from("plan_day_activities")
        .select("*")
        .in("plan_day_id", dayIds)
        .order("created_at", { ascending: true });

      if (actError) throw actError;

      return days.map((d) => ({
        ...d,
        activities: (activities || []).filter((a) => a.plan_day_id === d.id) as PlanDayActivity[],
      })) as PlanDay[];
    },
    enabled: !!planId,
  });

  // Ensure days exist
  const ensureDaysMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan ID");
      const { error } = await supabase.rpc("ensure_plan_days", { p_plan_id: planId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Add activity
  const addActivityMutation = useMutation({
    mutationFn: async ({ dayId, data }: { dayId: string; data: AddActivityData }) => {
      const { error } = await supabase.from("plan_day_activities").insert({
        plan_day_id: dayId,
        title: data.title,
        description: data.description || null,
        time_slot: data.time_slot || "any",
        estimated_cost: data.estimated_cost ?? null,
        currency: data.currency || "SAR",
        participant_scope: data.participant_scope || "all",
        participant_user_ids: data.participant_user_ids || null,
        created_by: "user",
        status: "idea",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t("itinerary.activity_saved") });
    },
    onError: () => {
      toast({ title: t("itinerary.suggest_error"), variant: "destructive" });
    },
  });

  // Update activity
  const updateActivityMutation = useMutation({
    mutationFn: async ({ activityId, data }: { activityId: string; data: Partial<AddActivityData & { status: string }> }) => {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.time_slot !== undefined) updateData.time_slot = data.time_slot;
      if (data.estimated_cost !== undefined) updateData.estimated_cost = data.estimated_cost;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.participant_scope !== undefined) updateData.participant_scope = data.participant_scope;
      if (data.participant_user_ids !== undefined) updateData.participant_user_ids = data.participant_user_ids;
      if (data.status !== undefined) updateData.status = data.status;

      const { error } = await supabase
        .from("plan_day_activities")
        .update(updateData)
        .eq("id", activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t("itinerary.activity_updated") });
    },
    onError: () => {
      toast({ title: t("itinerary.suggest_error"), variant: "destructive" });
    },
  });

  // Delete activity
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from("plan_day_activities")
        .delete()
        .eq("id", activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t("itinerary.activity_deleted") });
    },
    onError: () => {
      toast({ title: t("itinerary.suggest_error"), variant: "destructive" });
    },
  });

  // Generate AI suggestions for a day
  const generateMutation = useMutation({
    mutationFn: async ({ dayId, preferences }: { dayId: string; preferences?: string }) => {
      const { data, error } = await supabase.functions.invoke("plan-day-ai-suggest", {
        body: { day_id: dayId, preferences },
      });

      if (error) {
        // Check for specific errors in the response
        const errorBody = typeof error === "object" && "message" in error ? error.message : String(error);
        throw new Error(errorBody);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t("itinerary.suggest_success") });
    },
    onError: (error: Error) => {
      const msg = error.message;
      if (msg.includes("rate_limited")) {
        toast({ title: t("itinerary.suggest_rate_limited"), variant: "destructive" });
      } else if (msg.includes("no_destination")) {
        toast({ title: t("itinerary.suggest_no_destination"), variant: "destructive" });
      } else {
        toast({ title: t("itinerary.suggest_error"), variant: "destructive" });
      }
    },
  });

  // Convert activity to vote
  const convertToVoteMutation = useMutation({
    mutationFn: async (activity: PlanDayActivity) => {
      if (!planId) throw new Error("No plan ID");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create vote
      const { data: vote, error: voteError } = await supabase
        .from("plan_votes")
        .insert({
          plan_id: planId,
          title: activity.title,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (voteError) throw voteError;

      // Create options
      const { error: optError } = await supabase.from("plan_vote_options").insert([
        { vote_id: vote.id, option_text: "نعم" },
        { vote_id: vote.id, option_text: "لا" },
        { vote_id: vote.id, option_text: "بديل" },
      ]);
      if (optError) throw optError;

      // Link vote to activity
      const { error: linkError } = await supabase
        .from("plan_day_activities")
        .update({ linked_vote_id: vote.id, status: "proposed" })
        .eq("id", activity.id);
      if (linkError) throw linkError;

      return vote.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["plan-votes", planId] });
      toast({ title: t("itinerary.convert_vote_success") });
    },
    onError: () => {
      toast({ title: t("itinerary.convert_vote_error"), variant: "destructive" });
    },
  });

  // Link activity to expense
  const linkExpenseMutation = useMutation({
    mutationFn: async ({ activityId, expenseId }: { activityId: string; expenseId: string }) => {
      const { error } = await supabase
        .from("plan_day_activities")
        .update({ linked_expense_id: expenseId })
        .eq("id", activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t("itinerary.link_expense_dialog.link_success") });
    },
    onError: () => {
      toast({ title: t("itinerary.link_expense_dialog.link_error"), variant: "destructive" });
    },
  });

  return {
    days: daysQuery.data || [],
    isLoading: daysQuery.isLoading,
    refetch: daysQuery.refetch,
    ensureDays: ensureDaysMutation.mutateAsync,
    addActivity: addActivityMutation.mutateAsync,
    isAddingActivity: addActivityMutation.isPending,
    updateActivity: updateActivityMutation.mutateAsync,
    isUpdating: updateActivityMutation.isPending,
    deleteActivity: deleteActivityMutation.mutateAsync,
    isDeleting: deleteActivityMutation.isPending,
    generateSuggestions: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    convertToVote: convertToVoteMutation.mutateAsync,
    isConvertingVote: convertToVoteMutation.isPending,
    linkExpense: linkExpenseMutation.mutateAsync,
  };
}
