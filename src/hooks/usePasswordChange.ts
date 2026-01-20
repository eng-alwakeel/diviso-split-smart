import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePasswordChange() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword?: string) => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
        variant: "destructive"
      });
      return false;
    }

    // التحقق من تطابق كلمات المرور إذا تم تمريرها
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "تأكد من تطابق كلمة المرور الجديدة وتأكيدها",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // التحقق من صحة الجلسة أولاً
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        toast({
          title: "انتهت صلاحية الجلسة",
          description: "يرجى تسجيل الدخول مرة أخرى لتغيير كلمة المرور",
          variant: "destructive"
        });
        window.location.href = '/auth';
        return false;
      }

      // محاولة تحديث الجلسة
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        toast({
          title: "انتهت صلاحية الجلسة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          variant: "destructive"
        });
        window.location.href = '/auth';
        return false;
      }

      // التحقق من كلمة المرور الحالية بشكل آمن عبر edge function
      const { data: verificationResult, error: verificationError } = await supabase.functions.invoke('verify-password', {
        body: { currentPassword }
      });

      if (verificationError) {
        console.error('Password verification error:', verificationError);
        
        // التحقق من نوع الخطأ - هل هو خطأ جلسة؟
        const errorMessage = verificationError.message || '';
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Authorization')) {
          toast({
            title: "انتهت صلاحية الجلسة",
            description: "يرجى تسجيل الدخول مرة أخرى",
            variant: "destructive"
          });
          window.location.href = '/auth';
          return false;
        }
        
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