import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGroupStatus = (groupId?: string) => {
  const { toast } = useToast();
  const [closing, setClosing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [reopening, setReopening] = useState(false);

  // Finish trip — prevent new expenses, allow settlements only
  const finishGroup = useCallback(async (): Promise<boolean> => {
    if (!groupId) return false;
    setFinishing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: 'finished' })
        .eq('id', groupId);

      if (error) {
        toast({ title: 'فشل في إنهاء الرحلة', description: error.message, variant: 'destructive' });
        return false;
      }
      toast({ title: '🏁 تم إنهاء الرحلة بنجاح' });

      // Complete onboarding task
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('complete_onboarding_task', {
            p_task_name: 'close_group',
            p_user_id: user.id,
          });
        }
      } catch {}

      return true;
    } catch (error: any) {
      toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setFinishing(false);
    }
  }, [groupId, toast]);

  // Reopen trip — back to active
  const reopenGroup = useCallback(async (): Promise<boolean> => {
    if (!groupId) return false;
    setReopening(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: 'active' })
        .eq('id', groupId);

      if (error) {
        toast({ title: 'فشل في إعادة فتح الرحلة', description: error.message, variant: 'destructive' });
        return false;
      }
      toast({ title: '✅ تم إعادة فتح الرحلة' });
      return true;
    } catch (error: any) {
      toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setReopening(false);
    }
  }, [groupId, toast]);

  // Close a group (final)
  const closeGroup = useCallback(async (): Promise<boolean> => {
    if (!groupId) return false;
    setClosing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: 'closed', archived_at: new Date().toISOString() })
        .eq('id', groupId);

      if (error) {
        toast({ title: 'فشل في إغلاق المجموعة', description: error.message, variant: 'destructive' });
        return false;
      }
      toast({ title: '🔒 تم إغلاق المجموعة بنجاح' });

      // Complete onboarding task
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('complete_onboarding_task', {
            p_task_name: 'close_group',
            p_user_id: user.id,
          });
        }
      } catch {}

      return true;
    } catch (error: any) {
      toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setClosing(false);
    }
  }, [groupId, toast]);

  // Check if group is closed
  const checkGroupStatus = useCallback(async (): Promise<'active' | 'finished' | 'closed' | null> => {
    if (!groupId) return null;
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('status')
        .eq('id', groupId)
        .single();

      if (error) return null;
      return (data?.status as 'active' | 'finished' | 'closed') || 'active';
    } catch {
      return null;
    }
  }, [groupId]);

  return {
    finishGroup,
    reopenGroup,
    closeGroup,
    checkGroupStatus,
    finishing,
    reopening,
    closing
  };
};
