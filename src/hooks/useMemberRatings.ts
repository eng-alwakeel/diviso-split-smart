import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Rating {
  financial_commitment: number;
  time_commitment: number;
  cooperation: number;
  internal_comment?: string;
}

interface MemberRating {
  id: string;
  group_id: string;
  rater_id: string;
  rated_user_id: string;
  financial_commitment: number;
  time_commitment: number;
  cooperation: number;
  internal_comment: string | null;
  created_at: string;
}

export const useMemberRatings = (groupId?: string) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myRatings, setMyRatings] = useState<MemberRating[]>([]);

  // Submit a rating for a member
  const submitRating = useCallback(async (
    ratedUserId: string,
    rating: Rating
  ): Promise<boolean> => {
    if (!groupId) return false;
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'يجب تسجيل الدخول', variant: 'destructive' });
        return false;
      }

      const { error } = await supabase
        .from('member_ratings')
        .insert({
          group_id: groupId,
          rater_id: user.id,
          rated_user_id: ratedUserId,
          financial_commitment: rating.financial_commitment,
          time_commitment: rating.time_commitment,
          cooperation: rating.cooperation,
          internal_comment: rating.internal_comment || null
        });

      if (error) {
        if (error.message.includes('duplicate key')) {
          toast({ title: 'لقد قمت بتقييم هذا العضو مسبقاً', variant: 'destructive' });
        } else if (error.message.includes('Cannot rate yourself')) {
          toast({ title: 'لا يمكنك تقييم نفسك', variant: 'destructive' });
        } else {
          toast({ title: 'فشل في إرسال التقييم', description: error.message, variant: 'destructive' });
        }
        return false;
      }

      toast({ title: 'تم إرسال التقييم بنجاح' });
      return true;
    } catch (error: any) {
      toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [groupId, toast]);

  // Check if current user has rated a specific member
  const hasRatedMember = useCallback(async (ratedUserId: string): Promise<boolean> => {
    if (!groupId) return false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('member_ratings')
        .select('id')
        .eq('group_id', groupId)
        .eq('rater_id', user.id)
        .eq('rated_user_id', ratedUserId)
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  }, [groupId]);

  // Get list of members the current user hasn't rated yet
  const getPendingRatings = useCallback(async (
    memberIds: string[]
  ): Promise<string[]> => {
    if (!groupId || memberIds.length === 0) return [];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all ratings by current user in this group
      const { data: ratings, error } = await supabase
        .from('member_ratings')
        .select('rated_user_id')
        .eq('group_id', groupId)
        .eq('rater_id', user.id);

      if (error) return memberIds.filter(id => id !== user.id);

      const ratedUserIds = new Set(ratings?.map(r => r.rated_user_id) || []);
      
      // Return members not yet rated (excluding self)
      return memberIds.filter(id => id !== user.id && !ratedUserIds.has(id));
    } catch {
      return [];
    }
  }, [groupId]);

  // Fetch all ratings given by current user in this group
  const fetchMyRatings = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('member_ratings')
        .select('*')
        .eq('group_id', groupId)
        .eq('rater_id', user.id);

      if (!error && data) {
        setMyRatings(data as MemberRating[]);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  return {
    submitRating,
    hasRatedMember,
    getPendingRatings,
    fetchMyRatings,
    myRatings,
    submitting,
    loading
  };
};
