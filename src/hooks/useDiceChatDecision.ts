import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  DiceDecision, 
  DiceDecisionResult,
  getDecision, 
  toggleVote as toggleVoteService,
  rerollDecision as rerollDecisionService,
  getVoteThreshold 
} from '@/services/diceChatService';
import { useAnalyticsEvents } from '@/hooks/useAnalyticsEvents';

interface UseDiceChatDecisionReturn {
  decision: DiceDecision | null;
  isLoading: boolean;
  error: string | null;
  memberCount: number;
  threshold: number;
  hasVoted: boolean;
  canReroll: boolean;
  isVoting: boolean;
  isRerolling: boolean;
  vote: () => Promise<void>;
  reroll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDiceChatDecision(decisionId: string, groupId: string): UseDiceChatDecisionReturn {
  const { trackEvent } = useAnalyticsEvents();
  const [decision, setDecision] = useState<DiceDecision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);

  // Fetch decision and member count
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch decision
      const decisionData = await getDecision(decisionId);
      if (!decisionData) {
        setError('decision_not_found');
        return;
      }
      setDecision(decisionData);

      // Fetch member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);
      
      setMemberCount(count || 0);
    } catch (err) {
      console.error('[useDiceChatDecision] Error:', err);
      setError('fetch_failed');
    } finally {
      setIsLoading(false);
    }
  }, [decisionId, groupId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`dice_decision_${decisionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dice_decisions',
          filter: `id=eq.${decisionId}`,
        },
        (payload) => {
          const newData = payload.new as DiceDecision;
          setDecision({
            ...newData,
            results: newData.results as unknown as DiceDecisionResult[],
            votes: newData.votes as unknown as string[],
            dice_type: newData.dice_type as 'activity' | 'food' | 'quick',
            status: newData.status as 'open' | 'accepted' | 'rerolled' | 'expired',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [decisionId]);

  // Vote action
  const vote = useCallback(async () => {
    if (!decision || decision.status !== 'open' || isVoting) return;

    setIsVoting(true);
    try {
      const result = await toggleVoteService(decisionId);
      
      if (result.success) {
        trackEvent('dice_vote_cast', {
          decision_id: decisionId,
          dice_type: decision.dice_type,
          voted: result.voted,
        });

        if (result.autoAccepted) {
          trackEvent('dice_accepted_in_chat', {
            decision_id: decisionId,
            dice_type: decision.dice_type,
          });
        }
      }
    } catch (err) {
      console.error('[useDiceChatDecision] Vote error:', err);
    } finally {
      setIsVoting(false);
    }
  }, [decision, decisionId, isVoting, trackEvent]);

  // Reroll action
  const reroll = useCallback(async () => {
    if (!decision || decision.status !== 'open' || decision.rerolled_from || isRerolling) return;

    setIsRerolling(true);
    try {
      const result = await rerollDecisionService(decisionId);
      
      if (result.success) {
        trackEvent('dice_rerolled_in_chat', {
          decision_id: decisionId,
          new_decision_id: result.newDecisionId,
          dice_type: decision.dice_type,
        });
      }
    } catch (err) {
      console.error('[useDiceChatDecision] Reroll error:', err);
    } finally {
      setIsRerolling(false);
    }
  }, [decision, decisionId, isRerolling, trackEvent]);

  // Computed values
  const hasVoted = userId ? (decision?.votes?.includes(userId) || false) : false;
  const canReroll = decision?.status === 'open' && !decision?.rerolled_from;
  const threshold = getVoteThreshold(memberCount);

  return {
    decision,
    isLoading,
    error,
    memberCount,
    threshold,
    hasVoted,
    canReroll,
    isVoting,
    isRerolling,
    vote,
    reroll,
    refresh: fetchData,
  };
}
