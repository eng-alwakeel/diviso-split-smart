import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InviteeProgress {
  id: string;
  name: string;
  stage: 'pending' | 'joined' | 'expired' | 'blocked';
  joinedAt: Date | null;
  createdAt: Date;
  pointsEarned: number;
  firstUsageCompleted: boolean;
  groupSettlementCompleted: boolean;
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

      // Fetch referrals - exclude group_invite to only count direct referrals
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id, invitee_name, invitee_phone, status, joined_at, created_at, bonus_applied')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Fetch referral_progress for this inviter
      const { data: progressData, error: progressError } = await supabase
        .from('referral_progress')
        .select('referral_id, points_for_first_usage, points_for_group_settlement, total_points, first_usage_at, first_group_or_settlement_at')
        .eq('inviter_id', user.id);

      if (progressError) {
        console.warn('Error fetching referral progress:', progressError);
      }

      // Build a map of referral_id -> progress
      const progressMap = new Map<string, {
        pointsFirstUsage: number;
        pointsGroupSettlement: number;
        totalPoints: number;
        firstUsageAt: string | null;
        groupSettlementAt: string | null;
      }>();

      (progressData || []).forEach(p => {
        progressMap.set(p.referral_id, {
          pointsFirstUsage: p.points_for_first_usage || 0,
          pointsGroupSettlement: p.points_for_group_settlement || 0,
          totalPoints: p.total_points || 0,
          firstUsageAt: p.first_usage_at,
          groupSettlementAt: p.first_group_or_settlement_at,
        });
      });

      // Deduplicate referrals by extracting actual user ID from invitee_phone
      const seenUsers = new Map<string, typeof referrals[0]>();
      for (const ref of (referrals || [])) {
        // Extract user ID: invitee_phone may be "group_member_UUID" or a phone number
        const userKey = ref.invitee_phone?.startsWith('group_member_')
          ? ref.invitee_phone.replace('group_member_', '')
          : ref.invitee_phone;

        // Keep the one with best status (joined > pending) or oldest
        const existing = seenUsers.get(userKey);
        if (!existing) {
          seenUsers.set(userKey, ref);
        } else if (ref.status === 'joined' && existing.status !== 'joined') {
          seenUsers.set(userKey, ref);
        }
      }

      const uniqueReferrals = Array.from(seenUsers.values());

      // Calculate total points earned from referrals from usage_credits table
      const { data: rewardTransactions, error: rewardsError } = await supabase
        .from('usage_credits')
        .select('amount')
        .eq('user_id', user.id)
        .in('source', ['referral_first_usage', 'referral_milestone', 'referral_bonus']);

      if (rewardsError) throw rewardsError;

      const totalEarned = rewardTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

      // Map referrals to invitee progress with points tracking
      const inviteesProgress: InviteeProgress[] = uniqueReferrals.map(ref => {
        const progress = progressMap.get(ref.id);
        return {
          id: ref.id,
          name: ref.invitee_name || ref.invitee_phone || 'مستخدم',
          stage: ref.status as InviteeProgress['stage'],
          joinedAt: ref.joined_at ? new Date(ref.joined_at) : null,
          createdAt: new Date(ref.created_at),
          pointsEarned: progress?.totalPoints || 0,
          firstUsageCompleted: !!progress?.firstUsageAt,
          groupSettlementCompleted: !!progress?.groupSettlementAt,
        };
      });

      const joinedReferrals = uniqueReferrals.filter(r => r.status === 'joined').length;

      setStats({
        totalEarnedFromReferrals: totalEarned,
        totalReferrals: uniqueReferrals.length,
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
