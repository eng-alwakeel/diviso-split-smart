import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useProfileImage() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadProfileImage = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        throw new Error('يجب أن يكون الملف صورة');
      }

      // التحقق من حجم الملف (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // رفع الصورة
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // الحصول على URL الصورة
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // تحديث الملف الشخصي
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      toast({
        title: "تم رفع الصورة!",
        description: "تم تحديث صورة الملف الشخصي بنجاح",
      });

      return publicUrl;

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "خطأ في رفع الصورة",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  return {
    uploadProfileImage,
    uploading
  };
}