import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function usePhoneVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // حفظ الـ session الأصلي ومعرف المستخدم
  const originalSessionRef = useRef<Session | null>(null);
  const originalUserIdRef = useRef<string | null>(null);

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

  // حفظ الـ session الحالي قبل التحقق
  const saveCurrentSession = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        originalSessionRef.current = session;
        originalUserIdRef.current = session.user?.id || null;
        console.log('🔒 تم حفظ الـ session الأصلي:', originalUserIdRef.current);
        return true;
      }
      console.warn('⚠️ لا يوجد session لحفظه');
      return false;
    } catch (err) {
      console.error('❌ خطأ في حفظ الـ session:', err);
      return false;
    }
  };

  // استعادة الـ session الأصلي بعد التحقق
  const restoreOriginalSession = async (): Promise<boolean> => {
    try {
      if (originalSessionRef.current) {
        console.log('🔓 استعادة الـ session الأصلي...');
        const { error } = await supabase.auth.setSession({
          access_token: originalSessionRef.current.access_token,
          refresh_token: originalSessionRef.current.refresh_token
        });
        if (error) {
          console.error('❌ خطأ في استعادة الـ session:', error);
          return false;
        }
        console.log('✅ تم استعادة الـ session الأصلي');
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ خطأ في استعادة الـ session:', err);
      return false;
    }
  };

  // تحديث رقم الجوال في الـ profile الصحيح
  const updateProfilePhone = async (phoneNumber: string): Promise<boolean> => {
    try {
      const userId = originalUserIdRef.current;
      if (!userId) {
        console.error('❌ لا يوجد user ID محفوظ');
        return false;
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('📱 تحديث رقم الجوال للمستخدم:', userId, '→', formattedPhone);

      const { error } = await supabase
        .from('profiles')
        .update({ phone: formattedPhone })
        .eq('id', userId);

      if (error) {
        console.error('❌ خطأ في تحديث الـ profile:', error);
        return false;
      }

      console.log('✅ تم تحديث رقم الجوال في الـ profile');
      return true;
    } catch (err) {
      console.error('❌ خطأ في تحديث الـ profile:', err);
      return false;
    }
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

      // 1. حفظ الـ session الحالي قبل إرسال OTP
      await saveCurrentSession();

      if (DEV_MODE) {
        // وضع التطوير - محاكاة إرسال OTP
        console.log(`✅ وضع التطوير: OTP المرسل إلى ${formattedPhone}: ${DEV_OTP}`);
        
        toast({
          title: "تم إرسال رمز التحقق (وضع التطوير)",
          description: `رمز التحقق: ${DEV_OTP}`,
        });

        return true;
      }

      // 2. إرسال OTP
      console.log('🔵 استدعاء Supabase signInWithOtp...');
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: false // لا ننشئ مستخدم جديد، فقط التحقق
        }
      });

      console.log('🔵 استجابة Supabase:', { data, error });

      // 3. استعادة الـ session الأصلي فوراً بعد إرسال OTP
      await restoreOriginalSession();

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
          // تحديث الـ profile حتى في وضع التطوير
          await updateProfilePhone(phoneNumber);
          
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

      // 1. التحقق من OTP (للإنتاج)
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

      // 2. استعادة الـ session الأصلي بعد التحقق الناجح
      await restoreOriginalSession();

      // 3. تحديث رقم الجوال في الـ profile الصحيح
      const updateSuccess = await updateProfilePhone(phoneNumber);
      
      if (!updateSuccess) {
        console.warn('⚠️ تم التحقق لكن فشل تحديث الـ profile');
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
    formatPhoneNumber,
    originalUserId: originalUserIdRef.current
  };
}
