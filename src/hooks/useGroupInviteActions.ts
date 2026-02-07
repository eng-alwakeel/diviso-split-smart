import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const useGroupInviteActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation('groups');

  /**
   * Accept a group_invite_request via the respond_group_invite RPC
   */
  const acceptInvite = async (notificationId: string, inviteId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('respond_group_invite', {
        p_invite_id: inviteId,
        p_response: 'accept',
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) throw new Error(result.error);

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      // Get group_id from invite to navigate
      const { data: inviteData } = await supabase
        .from('group_invites')
        .select('group_id')
        .eq('id', inviteId)
        .single();

      toast({
        title: t('known_people.invite_accepted'),
        description: t('known_people.invite_accepted_desc'),
      });

      if (inviteData?.group_id) {
        navigate(`/group/${inviteData.group_id}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: t('error'),
        description: t('known_people.accept_failed'),
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Decline a group_invite_request via the respond_group_invite RPC
   */
  const rejectInvite = async (notificationId: string, inviteId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('respond_group_invite', {
        p_invite_id: inviteId,
        p_response: 'decline',
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) throw new Error(result.error);

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      toast({
        title: t('known_people.invite_declined'),
        description: t('known_people.invite_declined_desc'),
      });

      return { success: true };
    } catch (error) {
      console.error('Error declining invite:', error);
      toast({
        title: t('error'),
        description: t('known_people.decline_failed'),
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a pending invite (inviter/admin only)
   */
  const cancelInvite = async (inviteId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_group_invite', {
        p_invite_id: inviteId,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) throw new Error(result.error);

      toast({
        title: t('known_people.invite_canceled'),
        description: t('known_people.invite_canceled_desc'),
      });

      return { success: true };
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast({
        title: t('error'),
        description: t('known_people.cancel_failed'),
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    acceptInvite,
    rejectInvite,
    cancelInvite,
    loading,
  };
};
