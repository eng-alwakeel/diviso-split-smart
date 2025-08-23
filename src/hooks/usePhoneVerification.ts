import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function usePhoneVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validatePhoneNumber = (phone: string): boolean => {
    // تحقق من صحة رقم الهاتف السعودي
    const phoneRegex = /^(\+966|966|0)?5[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const formatPhoneNumber = (phone: string): string => {
    // تنسيق رقم الهاتف للإرسال
    let formattedPhone = phone.replace(/\s+/g, '');
    
    if (formattedPhone.startsWith('05')) {
      formattedPhone = '+966' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('5')) {
      formattedPhone = '+966' + formattedPhone;
    } else if (formattedPhone.startsWith('966')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+966')) {
      formattedPhone = '+966' + formattedPhone;
    }
    
    return formattedPhone;
  };

  const sendOTP = async (phoneNumber: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (!validatePhoneNumber(phoneNumber)) {
        setError("رقم الجوال غير صحيح");
        return false;
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      // استخدام Supabase Auth لإرسال OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: false // لا ننشئ مستخدم جديد، فقط التحقق
        }
      });

      if (error) {
        console.error('خطأ في إرسال OTP:', error);
        setError("فشل في إرسال رمز التحقق. تأكد من صحة رقم الجوال");
        return false;
      }

      toast({
        title: "تم إرسال رمز التحقق",
        description: `تم إرسال رمز التحقق إلى ${formattedPhone}`,
      });

      return true;
    } catch (error) {
      console.error('خطأ في إرسال OTP:', error);
      setError("حدث خطأ أثناء إرسال رمز التحقق");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // التحقق من OTP
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        console.error('خطأ في التحقق من OTP:', error);
        
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          setError("رمز التحقق غير صحيح أو منتهي الصلاحية");
        } else {
          setError("فشل في التحقق من الرمز. حاول مرة أخرى");
        }
        return false;
      }

      toast({
        title: "تم تأكيد رقم الجوال بنجاح!",
        description: "تم التحقق من رقم الجوال وحفظه في حسابك",
      });

      return true;
    } catch (error) {
      console.error('خطأ في التحقق من OTP:', error);
      setError("حدث خطأ أثناء التحقق من الرمز");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendOTP,
    verifyOTP,
    loading,
    error,
    validatePhoneNumber,
    formatPhoneNumber
  };
}