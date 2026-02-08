import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export interface PlanSuggestion {
  id: string;
  plan_id: string;
  category: string;
  title: string;
  details: string | null;
  created_by: string;
  created_at: string;
}

export interface PlanAISummary {
  plan_id: string;
  intent_summary_text: string;
  updated_at: string;
}

export function usePlanSuggestions(planId: string | undefined) {
  const { toast } = useToast();
  const { t } = useTranslation('plans');
  const queryClient = useQueryClient();
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const summaryQuery = useQuery({
    queryKey: ['plan-ai-summary', planId],
    queryFn: async () => {
      if (!planId) return null;
      const { data, error } = await supabase
        .from('plan_ai_summary')
        .select('*')
        .eq('plan_id', planId)
        .maybeSingle();

      if (error) throw error;
      return data as PlanAISummary | null;
    },
    enabled: !!planId,
  });

  const suggestionsQuery = useQuery({
    queryKey: ['plan-suggestions', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('plan_suggestions')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as PlanSuggestion[];
    },
    enabled: !!planId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error('No plan ID');
      const { data, error } = await supabase.functions.invoke('plan-ai-suggest', {
        body: { plan_id: planId },
      });

      if (error) {
        // Check for rate limiting
        if (error.message?.includes('429') || (data as any)?.error === 'rate_limited') {
          const retryAfter = (data as any)?.retry_after_seconds || 600;
          setRateLimitSeconds(retryAfter);
          throw new Error('rate_limited');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      setRateLimitSeconds(null);
      queryClient.invalidateQueries({ queryKey: ['plan-ai-summary', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-suggestions', planId] });
      toast({ title: t('suggestions.generated_success') });
    },
    onError: (error) => {
      if (error.message === 'rate_limited') {
        toast({
          title: t('suggestions.rate_limited'),
          description: t('suggestions.rate_limited_desc'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('suggestions.generate_error'),
          variant: 'destructive',
        });
      }
    },
  });

  // Group suggestions by category
  const groupedSuggestions = (suggestionsQuery.data || []).reduce(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<string, PlanSuggestion[]>
  );

  return {
    summary: summaryQuery.data,
    suggestions: suggestionsQuery.data || [],
    groupedSuggestions,
    isLoading: summaryQuery.isLoading || suggestionsQuery.isLoading,
    isGenerating: generateMutation.isPending,
    rateLimitSeconds,
    generate: generateMutation.mutateAsync,
    refetch: () => {
      summaryQuery.refetch();
      suggestionsQuery.refetch();
    },
  };
}
