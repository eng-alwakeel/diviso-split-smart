import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export interface VoteOption {
  id: string;
  vote_id: string;
  option_text: string;
  vote_count: number;
}

export interface PlanVote {
  id: string;
  plan_id: string;
  title: string;
  status: string;
  created_by: string;
  created_at: string;
  closes_at: string | null;
  options: VoteOption[];
  user_voted_option_id: string | null;
  total_votes: number;
}

interface CreateVoteParams {
  planId: string;
  title: string;
  options: string[];
  closesAt?: string | null;
}

export function usePlanVotes(planId: string | undefined) {
  const { toast } = useToast();
  const { t } = useTranslation('plans');
  const queryClient = useQueryClient();

  const votesQuery = useQuery({
    queryKey: ['plan-votes', planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch votes
      const { data: votes, error } = await supabase
        .from('plan_votes')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!votes || votes.length === 0) return [];

      const voteIds = votes.map(v => v.id);

      // Fetch options
      const { data: options } = await supabase
        .from('plan_vote_options')
        .select('*')
        .in('vote_id', voteIds);

      // Fetch all responses
      const { data: responses } = await supabase
        .from('plan_vote_responses')
        .select('*')
        .in('vote_id', voteIds);

      // Fetch user's votes
      const { data: userResponses } = await supabase
        .from('plan_vote_responses')
        .select('vote_id, option_id')
        .in('vote_id', voteIds)
        .eq('user_id', user.id);

      const userVoteMap = new Map(
        (userResponses || []).map(r => [r.vote_id, r.option_id])
      );

      // Count votes per option
      const optionVoteCount = new Map<string, number>();
      (responses || []).forEach(r => {
        optionVoteCount.set(r.option_id, (optionVoteCount.get(r.option_id) || 0) + 1);
      });

      // Total votes per vote
      const totalVotesMap = new Map<string, number>();
      (responses || []).forEach(r => {
        totalVotesMap.set(r.vote_id, (totalVotesMap.get(r.vote_id) || 0) + 1);
      });

      return votes.map(v => ({
        ...v,
        options: (options || [])
          .filter(o => o.vote_id === v.id)
          .map(o => ({
            ...o,
            vote_count: optionVoteCount.get(o.id) || 0,
          })),
        user_voted_option_id: userVoteMap.get(v.id) || null,
        total_votes: totalVotesMap.get(v.id) || 0,
      })) as PlanVote[];
    },
    enabled: !!planId,
  });

  const createVoteMutation = useMutation({
    mutationFn: async ({ planId, title, options, closesAt }: CreateVoteParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create vote
      const { data: vote, error: voteError } = await supabase
        .from('plan_votes')
        .insert({
          plan_id: planId,
          title,
          created_by: user.id,
          closes_at: closesAt || null,
        })
        .select('id')
        .single();

      if (voteError) throw voteError;

      // Create options
      const { error: optionsError } = await supabase
        .from('plan_vote_options')
        .insert(
          options.map(text => ({
            vote_id: vote.id,
            option_text: text,
          }))
        );

      if (optionsError) throw optionsError;
      return vote.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-votes', planId] });
      toast({ title: t('votes.created_success') });
    },
    onError: () => {
      toast({ title: t('votes.create_error'), variant: 'destructive' });
    },
  });

  const castVoteMutation = useMutation({
    mutationFn: async ({ voteId, optionId }: { voteId: string; optionId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert: delete old vote then insert new
      await supabase
        .from('plan_vote_responses')
        .delete()
        .eq('vote_id', voteId)
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('plan_vote_responses')
        .insert({
          vote_id: voteId,
          option_id: optionId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-votes', planId] });
      toast({ title: t('votes.voted_success') });
    },
    onError: () => {
      toast({ title: t('votes.vote_error'), variant: 'destructive' });
    },
  });

  const closeVoteMutation = useMutation({
    mutationFn: async (voteId: string) => {
      const { error } = await supabase
        .from('plan_votes')
        .update({ status: 'closed' })
        .eq('id', voteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-votes', planId] });
      toast({ title: t('votes.closed_success') });
    },
    onError: () => {
      toast({ title: t('votes.close_error'), variant: 'destructive' });
    },
  });

  return {
    votes: votesQuery.data || [],
    isLoading: votesQuery.isLoading,
    createVote: createVoteMutation.mutateAsync,
    isCreating: createVoteMutation.isPending,
    castVote: castVoteMutation.mutateAsync,
    isCasting: castVoteMutation.isPending,
    closeVote: closeVoteMutation.mutateAsync,
    isClosing: closeVoteMutation.isPending,
    refetch: votesQuery.refetch,
  };
}
