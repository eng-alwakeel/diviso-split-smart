import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGroupArchive = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const archiveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc('archive_group', {
        p_group_id: groupId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast({
        title: "تم الأرشفة",
        description: "تم أرشفة المجموعة بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('Error archiving group:', error);
      toast({
        title: "خطأ",
        description: "فشل في أرشفة المجموعة",
        variant: "destructive",
      });
    },
  });

  const unarchiveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc('unarchive_group', {
        p_group_id: groupId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast({
        title: "تم الاستعادة",
        description: "تم استعادة المجموعة من الأرشيف",
      });
    },
    onError: (error: any) => {
      console.error('Error unarchiving group:', error);
      toast({
        title: "خطأ",
        description: "فشل في استعادة المجموعة",
        variant: "destructive",
      });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc('admin_delete_group', {
        p_group_id: groupId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المجموعة نهائياً",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting group:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المجموعة",
        variant: "destructive",
      });
    },
  });

  return {
    archiveGroup: archiveGroup.mutate,
    unarchiveGroup: unarchiveGroup.mutate,
    deleteGroup: deleteGroup.mutate,
    isArchiving: archiveGroup.isPending,
    isUnarchiving: unarchiveGroup.isPending,
    isDeleting: deleteGroup.isPending,
  };
};