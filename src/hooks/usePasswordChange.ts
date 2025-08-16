import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePasswordChange() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // التحقق من كلمة المرور الحالية عبر محاولة تسجيل الدخول
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('لم يتم العثور على بيانات المستخدم');
      }

      // محاولة تسجيل الدخول للتحقق من كلمة المرور الحالية
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        toast({
          title: "كلمة مرور خاطئة",
          description: "كلمة المرور الحالية غير صحيحة",
          variant: "destructive"
        });
        return false;
      }

      // تغيير كلمة المرور
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "تم تغيير كلمة المرور!",
        description: "تم تحديث كلمة المرور بنجاح",
      });

      return true;

    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "خطأ في تغيير كلمة المرور",
        description: "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    changePassword,
    loading
  };
}