import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export type VerificationMethod = 'email' | 'phone' | 'none';
export type PasswordChangeStep = 'idle' | 'sent' | 'verify' | 'set-password';

interface UserVerificationInfo {
  email: string | null;
  phone: string | null;
  method: VerificationMethod;
}

export function useSecurePasswordChange() {
  const { toast } = useToast();
  const { t } = useTranslation(['settings', 'common']);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<PasswordChangeStep>('idle');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('none');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Get user's available verification methods
  const getUserVerificationInfo = useCallback(async (): Promise<UserVerificationInfo> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { email: null, phone: null, method: 'none' };
    }

    // Email is prioritized (cheaper)
    if (user.email) {
      return { email: user.email, phone: user.phone || null, method: 'email' };
    }
    
    // Fallback to phone
    if (user.phone) {
      return { email: null, phone: user.phone, method: 'phone' };
    }

    return { email: null, phone: null, method: 'none' };
  }, []);

  // Start countdown timer for resend
  const startResendCountdown = useCallback(() => {
    setResendCountdown(60);
    const timer = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Initiate password change - send verification
  const initiatePasswordChange = useCallback(async (): Promise<{ 
    success: boolean; 
    method: VerificationMethod;
    destination?: string;
  }> => {
    setLoading(true);
    try {
      const info = await getUserVerificationInfo();

      if (info.method === 'none') {
        toast({
          title: t('settings:security.no_verification_method'),
          description: t('settings:security.add_email_or_phone'),
          variant: "destructive"
        });
        return { success: false, method: 'none' };
      }

      if (info.method === 'email' && info.email) {
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(info.email, {
          redirectTo: `${window.location.origin}/settings?tab=privacy&action=reset`
        });

        if (error) {
          console.error('Email reset error:', error);
          toast({
            title: t('common:error'),
            description: error.message,
            variant: "destructive"
          });
          return { success: false, method: 'email' };
        }

        setVerificationMethod('email');
        setStep('sent');
        toast({
          title: t('settings:security.email_sent'),
          description: t('settings:security.check_email_for_link'),
        });
        
        return { success: true, method: 'email', destination: info.email };
      }

      if (info.method === 'phone' && info.phone) {
        // Send OTP to phone
        const { error } = await supabase.auth.signInWithOtp({
          phone: info.phone,
          options: { shouldCreateUser: false }
        });

        if (error) {
          console.error('Phone OTP error:', error);
          toast({
            title: t('common:error'),
            description: error.message,
            variant: "destructive"
          });
          return { success: false, method: 'phone' };
        }

        setVerificationMethod('phone');
        setStep('verify');
        startResendCountdown();
        toast({
          title: t('settings:security.otp_sent'),
          description: t('settings:security.enter_otp_code'),
        });

        return { success: true, method: 'phone', destination: info.phone };
      }

      return { success: false, method: 'none' };
    } catch (error: any) {
      console.error('Initiate password change error:', error);
      toast({
        title: t('common:error'),
        description: error.message || t('common:unknown_error'),
        variant: "destructive"
      });
      return { success: false, method: 'none' };
    } finally {
      setLoading(false);
    }
  }, [getUserVerificationInfo, startResendCountdown, toast, t]);

  // Verify OTP and set new password (phone method)
  const verifyOtpAndSetPassword = useCallback(async (
    otp: string, 
    newPassword: string
  ): Promise<boolean> => {
    if (newPassword.length < 8) {
      toast({
        title: t('settings:security.weak_password'),
        description: t('settings:security.password_min_length'),
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const info = await getUserVerificationInfo();
      
      if (!info.phone) {
        toast({
          title: t('common:error'),
          description: t('settings:security.phone_not_found'),
          variant: "destructive"
        });
        return false;
      }

      // Verify OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: info.phone,
        token: otp,
        type: 'sms'
      });

      if (verifyError) {
        console.error('OTP verification error:', verifyError);
        toast({
          title: t('settings:security.invalid_otp'),
          description: t('settings:security.try_again'),
          variant: "destructive"
        });
        return false;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        toast({
          title: t('common:error'),
          description: updateError.message,
          variant: "destructive"
        });
        return false;
      }

      setStep('idle');
      toast({
        title: t('settings:security.password_changed'),
        description: t('settings:security.password_updated_successfully'),
      });

      return true;
    } catch (error: any) {
      console.error('Verify and set password error:', error);
      toast({
        title: t('common:error'),
        description: error.message || t('common:unknown_error'),
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [getUserVerificationInfo, toast, t]);

  // Set new password directly (email method - after redirect)
  const setNewPassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (newPassword.length < 8) {
      toast({
        title: t('settings:security.weak_password'),
        description: t('settings:security.password_min_length'),
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        toast({
          title: t('common:error'),
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setStep('idle');
      toast({
        title: t('settings:security.password_changed'),
        description: t('settings:security.password_updated_successfully'),
      });

      return true;
    } catch (error: any) {
      console.error('Set password error:', error);
      toast({
        title: t('common:error'),
        description: error.message || t('common:unknown_error'),
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Resend OTP
  const resendOtp = useCallback(async (): Promise<boolean> => {
    if (resendCountdown > 0) return false;

    const result = await initiatePasswordChange();
    return result.success;
  }, [resendCountdown, initiatePasswordChange]);

  // Reset state
  const resetState = useCallback(() => {
    setStep('idle');
    setVerificationMethod('none');
    setResendCountdown(0);
  }, []);

  // Mask email for display
  const maskEmail = useCallback((email: string): string => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }, []);

  // Mask phone for display
  const maskPhone = useCallback((phone: string): string => {
    if (phone.length <= 4) return phone;
    return `***${phone.slice(-4)}`;
  }, []);

  return {
    loading,
    step,
    verificationMethod,
    resendCountdown,
    getUserVerificationInfo,
    initiatePasswordChange,
    verifyOtpAndSetPassword,
    setNewPassword,
    resendOtp,
    resetState,
    maskEmail,
    maskPhone
  };
}
