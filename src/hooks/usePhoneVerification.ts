import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function usePhoneVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // وضع التطوير - يتحدد تلقائياً حسب البيئة
  const DEV_MODE = import.meta.env.DEV && false; // تم إيقاف وضع التطوير للإنتاج
  const DEV_OTP = "123456";

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
        toast({
          title: "خطأ",
          description: "رقم الجوال غير صحيح",
          variant: "destructive",
        });
        return false;
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('🔵 محاولة إرسال OTP إلى:', formattedPhone);

      if (DEV_MODE) {
        // وضع التطوير - محاكاة إرسال OTP
        console.log(`✅ وضع التطوير: OTP المرسل إلى ${formattedPhone}: ${DEV_OTP}`);
        
        toast({
          title: "تم إرسال رمز التحقق (وضع التطوير)",
          description: `رمز التحقق: ${DEV_OTP}`,
        });

        return true;
      }

      // استخدام Supabase Auth لإرسال OTP (للإنتاج)
      console.log('🔵 استدعاء Supabase signInWithOtp...');
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: false // لا ننشئ مستخدم جديد، فقط التحقق
        }
      });

      console.log('🔵 استجابة Supabase:', { data, error });

      if (error) {
        console.error('❌ خطأ في إرسال OTP:', error);
        
        // رسائل خطأ مفصلة
        let errorMessage = "فشل في إرسال رمز التحقق";
        
        if (error.message.includes('SMS provider')) {
          errorMessage = "خدمة الرسائل غير مفعلة. يرجى التحقق من إعدادات MessageBird في Supabase";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "تم إرسال عدد كبير من الرسائل. يرجى الانتظار قليلاً";
        } else if (error.message.includes('invalid phone')) {
          errorMessage = "رقم الجوال غير صحيح. تأكد من الصيغة: +966501234567";
        }
        
        setError(errorMessage);
        toast({
          title: "خطأ في إرسال الرمز",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ تم إرسال OTP بنجاح');
      toast({
        title: "تم إرسال رمز التحقق",
        description: `تم إرسال رمز التحقق إلى ${formattedPhone}`,
      });

      return true;
    } catch (error: any) {
      console.error('❌ خطأ غير متوقع في إرسال OTP:', error);
      const errorMessage = error?.message || "حدث خطأ أثناء إرسال رمز التحقق";
      setError(errorMessage);
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
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

      if (DEV_MODE) {
        // وضع التطوير - التحقق من OTP الثابت
        if (otp === DEV_OTP) {
          toast({
            title: "تم تأكيد رقم الجوال بنجاح! (وضع التطوير)",
            description: "تم التحقق من رقم الجوال وحفظه في حسابك",
          });
          return true;
        } else {
          setError("رمز التحقق غير صحيح. استخدم: " + DEV_OTP);
          return false;
        }
      }

      // التحقق من OTP (للإنتاج)
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