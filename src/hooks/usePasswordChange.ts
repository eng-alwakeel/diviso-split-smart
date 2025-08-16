import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePasswordChange() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // التحقق من كلمة المرور الحالية بشكل آمن عبر edge function
      const { data: verificationResult, error: verificationError } = await supabase.functions.invoke('verify-password', {
        body: { currentPassword }
      });

      if (verificationError) {
        console.error('Password verification error:', verificationError);
        toast({
          title: "خطأ في التحقق",
          description: "حدث خطأ أثناء التحقق من كلمة المرور",
          variant: "destructive"
        });
        return false;
      }

      if (!verificationResult?.valid) {
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