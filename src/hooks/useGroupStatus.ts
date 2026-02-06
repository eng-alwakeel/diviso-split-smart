import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGroupStatus = (groupId?: string) => {
  const { toast } = useToast();
  const [closing, setClosing] = useState(false);

  // Close a group
  const closeGroup = useCallback(async (): Promise<boolean> => {
    if (!groupId) return false;
    
    setClosing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: 'closed' })
        .eq('id', groupId);

      if (error) {
        toast({ 
          title: 'فشل في إغلاق المجموعة', 
          description: error.message, 
          variant: 'destructive' 
        });
        return false;
      }

      toast({ title: 'تم إغلاق المجموعة بنجاح' });
      return true;
    } catch (error: any) {
      toast({ 
        title: 'حدث خطأ', 
        description: error.message, 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setClosing(false);
    }
  }, [groupId, toast]);

  // Check if group is closed
  const checkGroupStatus = useCallback(async (): Promise<'active' | 'closed' | null> => {
    if (!groupId) return null;
    
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('status')
        .eq('id', groupId)
        .single();

      if (error) return null;
      return (data?.status as 'active' | 'closed') || 'active';
    } catch {
      return null;
    }
  }, [groupId]);

  return {
    closeGroup,
    checkGroupStatus,
    closing
  };
};
