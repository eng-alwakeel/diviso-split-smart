import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useGroupInviteActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const acceptInvite = async (notificationId: string, inviteId: string) => {
    setLoading(true);
    try {
      // Update invite status to accepted
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ 
          status: 'accepted',
          accepted_by: (await supabase.auth.getUser()).data.user?.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteId);

      if (inviteError) throw inviteError;

      // Get invite details to add user to group
      const { data: invite, error: fetchError } = await supabase
        .from('invites')
        .select('group_id, invited_role')
        .eq('id', inviteId)
        .single();

      if (fetchError) throw fetchError;

      // Add user to group members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: invite.invited_role
        });

      if (memberError) throw memberError;

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      toast({
        title: 'تم قبول الدعوة',
        description: 'تم انضمامك للمجموعة بنجاح',
      });

      // Navigate to the group
      navigate(`/group/${invite.group_id}`);

      return { success: true };
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في قبول الدعوة',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const rejectInvite = async (notificationId: string, inviteId: string) => {
    setLoading(true);
    try {
      // Update invite status to rejected
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ 
          status: 'revoked',
        })
        .eq('id', inviteId);

      if (inviteError) throw inviteError;

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      toast({
        title: 'تم رفض الدعوة',
        description: 'تم رفض دعوة الانضمام للمجموعة',
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting invite:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في رفض الدعوة',
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
    loading
  };
};