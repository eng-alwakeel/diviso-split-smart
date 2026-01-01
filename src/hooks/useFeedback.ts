import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export type FeedbackPaymentIntent = 'yes' | 'no' | 'maybe';
export type FeedbackStatus = 'new' | 'reviewing' | 'planned' | 'in_progress' | 'done' | 'rejected';
export type FeedbackCategory = 'payment' | 'credits' | 'groups' | 'recommendations' | 'account' | 'technical';

export interface Feedback {
  id: string;
  user_id: string;
  idea: string;
  reason?: string;
  would_pay: FeedbackPaymentIntent;
  category: FeedbackCategory;
  rice_reach: number;
  rice_impact: number;
  rice_confidence: number;
  rice_effort: number;
  rice_score?: number;
  status: FeedbackStatus;
  votes: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name?: string;
    name?: string;
  };
}

export interface CreateFeedbackData {
  idea: string;
  reason?: string;
  would_pay: FeedbackPaymentIntent;
  category: FeedbackCategory;
}

export function useMyFeedback() {
  return useQuery({
    queryKey: ['my-feedback'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    },
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('support');

  return useMutation({
    mutationFn: async (feedbackData: CreateFeedbackData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customer_feedback')
        .insert({
          user_id: user.id,
          idea: feedbackData.idea,
          reason: feedbackData.reason,
          would_pay: feedbackData.would_pay,
          category: feedbackData.category,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      toast({
        title: t('feedback.success'),
      });
    },
    onError: () => {
      toast({
        title: t('feedback.error'),
        variant: 'destructive',
      });
    },
  });
}

// Admin hooks
export function useAllFeedback(filters?: {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  wouldPay?: FeedbackPaymentIntent;
}) {
  return useQuery({
    queryKey: ['all-feedback', filters],
    queryFn: async () => {
      let query = supabase
        .from('customer_feedback')
        .select(`
          *,
          profiles:user_id (
            display_name,
            name
          )
        `)
        .order('rice_score', { ascending: false, nullsFirst: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.wouldPay) {
        query = query.eq('would_pay', filters.wouldPay);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Feedback[];
    },
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      feedbackId, 
      updates 
    }: { 
      feedbackId: string; 
      updates: Partial<Feedback>;
    }) => {
      const { error } = await supabase
        .from('customer_feedback')
        .update(updates)
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-feedback'] });
    },
  });
}

export function useFeedbackStats() {
  return useQuery({
    queryKey: ['feedback-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*');

      if (error) throw error;

      const feedback = data as Feedback[];

      return {
        total: feedback.length,
        new: feedback.filter(f => f.status === 'new').length,
        planned: feedback.filter(f => f.status === 'planned').length,
        inProgress: feedback.filter(f => f.status === 'in_progress').length,
        done: feedback.filter(f => f.status === 'done').length,
        wouldPayYes: feedback.filter(f => f.would_pay === 'yes').length,
        topCategories: Object.entries(
          feedback.reduce((acc, f) => {
            acc[f.category] = (acc[f.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1]),
      };
    },
  });
}
