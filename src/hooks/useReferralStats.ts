import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InviteeProgress {
  id: string;
  name: string;
  stage: 'pending' | 'joined' | 'expired' | 'blocked';
  joinedAt: Date | null;
  createdAt: Date;
}

interface ReferralStats {
  totalEarnedFromReferrals: number;
  totalReferrals: number;
  joinedReferrals: number;
  inviteesProgress: InviteeProgress[];
  loading: boolean;
}

export function useReferralStats(): ReferralStats {
  const [stats, setStats] = useState<ReferralStats>({
    totalEarnedFromReferrals: 0,
    totalReferrals: 0,
    joinedReferrals: 0,
    inviteesProgress: [],
    loading: true
  });

  const fetchReferralStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      // Fetch referrals
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id, invitee_name, invitee_phone, status, joined_at, created_at, bonus_applied')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Calculate total points earned from referrals from usage_credits table
      const { data: rewardTransactions, error: rewardsError } = await supabase
        .from('usage_credits')
        .select('amount')
        .eq('user_id', user.id)
        .in('source', ['referral_first_usage', 'referral_milestone', 'referral_bonus']);

      if (rewardsError) throw rewardsError;

      const totalEarned = rewardTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

      // Map referrals to invitee progress
      const inviteesProgress: InviteeProgress[] = (referrals || []).map(ref => ({
        id: ref.id,
        name: ref.invitee_name || ref.invitee_phone || 'مستخدم',
        stage: ref.status,
        joinedAt: ref.joined_at ? new Date(ref.joined_at) : null,
        createdAt: new Date(ref.created_at)
      }));

      const joinedReferrals = (referrals || []).filter(r => r.status === 'joined').length;

      setStats({
        totalEarnedFromReferrals: totalEarned,
        totalReferrals: referrals?.length || 0,
        joinedReferrals,
        inviteesProgress,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching referral stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  return stats;
}
