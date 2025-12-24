import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Mail, Phone, Gift, Check, X, Loader2, Eye, EyeOff } from "lucide-react";
import { PrivacyPolicyCheckbox } from "@/components/ui/privacy-policy-checkbox";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startTrial } = useSubscription();
  const [mode, setMode] = useState<"login" | "signup" | "verify" | "forgot-password" | "reset-password">("login");
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP resend countdown states
  const [resendCountdown, setResendCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  // Referral code states
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && (mode === "verify" || mode === "reset-password")) {
      setCanResend(true);
    }
  }, [resendCountdown, mode]);

  // Validate referral code
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.length < 6) {
      setReferralValid(null);
      return;
    }
    
    setCheckingReferral(true);
    try {
      const { data } = await supabase
        .from("user_referral_codes")
        .select("user_id")
        .eq("referral_code", code.toUpperCase())
        .maybeSingle();
      
      setReferralValid(!!data);
    } catch {
      setReferralValid(false);
    } finally {
      setCheckingReferral(false);
    }
  }, []);

  // Debounced referral code validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (referralCode) {
        validateReferralCode(referralCode);
      } else {
        setReferralValid(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [referralCode, validateReferralCode]);

  useEffect(() => {
    const location = window.location;
    const params = new URLSearchParams(location.search);
    const trialPlan = params.get("startTrial");
    const redirectTo = params.get("redirectTo") || "/dashboard";
    const joinToken = localStorage.getItem('joinToken');
    const phoneInviteToken = localStorage.getItem('phoneInviteToken');

    // Listen first, then get existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // إذا كان هناك joinToken، نعيد التوجيه للرابط المناسب
        if (joinToken) {
          localStorage.removeItem('joinToken');
          window.location.href = `/i/${joinToken}`;
          return;
        }
        
        // إذا كان هناك phoneInviteToken، نعيد التوجيه للرابط المناسب
        if (phoneInviteToken) {
          localStorage.removeItem('phoneInviteToken');
          window.location.href = `/invite-phone/${phoneInviteToken}`;
          return;
        }
        
        if (trialPlan === "personal" || trialPlan === "family") {
          setTimeout(async () => {
            try { await startTrial(trialPlan as any); } catch {}
            navigate(redirectTo, { replace: true });
          }, 0);
        } else {
          navigate(redirectTo === "/dashboard" ? "/dashboard" : redirectTo);
        }
      }
    });
    
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        // إذا كان هناك joinToken، نعيد التوجيه للرابط المناسب
        if (joinToken) {
          localStorage.removeItem('joinToken');
          window.location.href = `/i/${joinToken}`;
          return;
        }
        
        // إذا كان هناك phoneInviteToken، نعيد التوجيه للرابط المناسب
        if (phoneInviteToken) {
          localStorage.removeItem('phoneInviteToken');
          window.location.href = `/invite-phone/${phoneInviteToken}`;
          return;
        }
        
        if (trialPlan === "personal" || trialPlan === "family") {
          setTimeout(async () => {
            try { await startTrial(trialPlan as any); } catch {}
            navigate(redirectTo, { replace: true });
          }, 0);
        } else {
          navigate(redirectTo === "/dashboard" ? "/dashboard" : redirectTo);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, startTrial]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    const credentials = authType === "email" 
      ? { email, password }
      : { phone, password };
    
    const { error } = await supabase.auth.signInWithPassword(credentials);
    setLoading(false);
    
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل الدخول" });
    }
  };

  const handleSignup = async () => {
    if (!privacyAccepted) {
      toast({ 
        title: "يجب الموافقة على سياسة الخصوصية", 
        description: "يرجى الموافقة على سياسة الخصوصية وشروط الاستخدام للمتابعة",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    console.log('🔵 بدء عملية التسجيل...', { authType, phone, email });
    
    const signUpData = authType === "email" 
      ? { 
          email, 
          password,
          options: {
            data: { 
              name,
              privacy_policy_accepted: true,
              privacy_policy_accepted_at: new Date().toISOString()
            },
            emailRedirectTo: `${window.location.origin}/auth/verify`
          }
        }
      : { 
          phone, 
          password,
          options: {
            data: { 
              name,
              privacy_policy_accepted: true,
              privacy_policy_accepted_at: new Date().toISOString()
            }
          }
        };
    
    console.log('🔵 بيانات التسجيل:', { 
      type: authType, 
      hasPhone: !!phone, 
      hasEmail: !!email,
      hasPassword: !!password 
    });
    
    const { data, error } = await supabase.auth.signUp(signUpData);
    
    console.log('🔵 استجابة التسجيل:', { data, error });
    
    if (error) {
      setLoading(false);
      console.error('❌ خطأ في التسجيل:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('SMS provider')) {
        errorMessage = "خدمة الرسائل غير مفعلة. يرجى التحقق من إعدادات MessageBird";
      } else if (error.message.includes('User already registered')) {
        errorMessage = "هذا الحساب موجود بالفعل. يرجى تسجيل الدخول";
      }
      
      toast({ 
        title: "خطأ في التسجيل", 
        description: errorMessage, 
        variant: "destructive" 
      });
      return;
    }
    
    // If referral code is valid, process it
    if (referralValid && referralCode && data?.user) {
      try {
        console.log('🎁 Processing referral code:', referralCode);
        const { error: referralError } = await supabase.functions.invoke('process-referral-signup', {
          body: {
            userId: data.user.id,
            referralCode: referralCode.toUpperCase(),
            userPhone: authType === "phone" ? phone : "",
            userName: name
          }
        });
        
        if (referralError) {
          console.error('❌ Referral processing error:', referralError);
        } else {
          console.log('✅ Referral processed successfully');
        }
      } catch (err) {
        console.error('❌ Error processing referral:', err);
      }
    }
    
    setLoading(false);
    
    if (authType === "email") {
      console.log('✅ تم التسجيل بالإيميل');
      const successMessage = referralValid 
        ? "تم إرسال رابط التحقق إلى بريدك الإلكتروني. ستحصل على 7 أيام مجانية بعد التفعيل!"
        : "تم إرسال رابط التحقق إلى بريدك الإلكتروني";
      toast({ 
        title: "تحقق من بريدك الإلكتروني", 
        description: successMessage
      });
    } else {
      console.log('✅ تم التسجيل بالهاتف - إرسال OTP يدوياً...');
      
      // إرسال OTP يدوياً بعد إنشاء الحساب لأن signUp مع password لا يرسل SMS
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false }
      });
      
      if (otpError) {
        console.error('❌ خطأ في إرسال OTP:', otpError);
        // نستمر لصفحة التحقق حتى لو فشل - المستخدم يمكنه الضغط على "إعادة الإرسال"
      } else {
        console.log('✅ تم إرسال OTP بنجاح');
      }
      
      setMode("verify");
      setResendCountdown(60);
      setCanResend(false);
      const successMessage = referralValid
        ? "أدخل الرمز المرسل إلى رقم هاتفك. ستحصل على 7 أيام مجانية بعد التفعيل!"
        : "أدخل الرمز المرسل إلى رقم هاتفك";
      toast({ 
        title: "تم إرسال رمز التحقق", 
        description: successMessage
      });
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms'
    });
    
    setLoading(false);
    if (error) {
      toast({ title: "خطأ في التحقق", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم التحقق بنجاح", description: "مرحباً بك!" });
    }
  };

  const handleForgotPasswordEmail = async () => {
    if (!email) {
      toast({ title: "خطأ", description: "يرجى إدخال البريد الإلكتروني", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    
    setLoading(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "تم الإرسال", 
        description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" 
      });
    }
  };

  const handleForgotPasswordPhone = async () => {
    if (!phone) {
      toast({ title: "خطأ", description: "يرجى إدخال رقم الهاتف", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false }
    });
    
    setLoading(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setMode("reset-password");
      toast({ 
        title: "تم الإرسال", 
        description: "تم إرسال رمز التحقق إلى هاتفك" 
      });
    }
  };

  const handleResetPasswordWithOtp = async () => {
    if (!otp) {
      toast({ title: "خطأ", description: "يرجى إدخال رمز التحقق", variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمات المرور غير متطابقة", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    // First verify OTP
    const { error: otpError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms'
    });
    
    if (otpError) {
      setLoading(false);
      toast({ title: "خطأ", description: otpError.message, variant: "destructive" });
      return;
    }
    
    // Then update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    
    setLoading(false);
    if (updateError) {
      toast({ title: "خطأ", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح" });
      setMode("login");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
    }
  };

  // Handle password reset from email link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "reset") {
      setMode("reset-password");
    }
  }, []);

  const handleUpdatePasswordFromEmail = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمات المرور غير متطابقة", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    setLoading(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح" });
      setMode("login");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="auth-container">
        <Card className="bg-card border border-border rounded-2xl">
          <CardHeader>
            <div className="flex flex-col items-center gap-3 mb-2">
              <img 
                src="/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png" 
                alt="شعار Diviso" 
                className="h-10 w-auto" 
                width={160} 
                height={40} 
              />
              <p className="text-xs text-muted-foreground font-medium">
                قسّم بذكاء، سافر براحة
              </p>
            </div>
            <CardTitle className="text-center">
              {mode === "login" ? "تسجيل الدخول" : 
               mode === "signup" ? "إنشاء حساب" : 
               mode === "forgot-password" ? "نسيت كلمة المرور" :
               mode === "reset-password" ? "إعادة تعيين كلمة المرور" :
               authType === "phone" ? "تحقق من رقم الهاتف" : "تحقق من البريد الإلكتروني"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode !== "verify" && mode !== "forgot-password" && mode !== "reset-password" && (
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  الدخول بحساب Google
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">أو</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Forgot Password Mode */}
            {mode === "forgot-password" && (
              <div className="space-y-4">
                <Tabs value={authType} onValueChange={(value) => setAuthType(value as "email" | "phone")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الهاتف
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                      <Input 
                        id="reset-email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="example@domain.com"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <Button className="w-full" onClick={handleForgotPasswordEmail} disabled={loading}>
                      {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="phone" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-phone">رقم الهاتف</Label>
                      <PhoneInputWithCountry
                        value={phone}
                        onChange={setPhone}
                        placeholder="501234567"
                      />
                    </div>
                    <Button className="w-full" onClick={handleForgotPasswordPhone} disabled={loading}>
                      {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
                    </Button>
                  </TabsContent>
                </Tabs>
                
                <Button variant="outline" className="w-full" onClick={() => setMode("login")}>
                  العودة لتسجيل الدخول
                </Button>
              </div>
            )}
            
            {/* Reset Password Mode (after OTP for phone or email link) */}
            {mode === "reset-password" && (
              <div className="space-y-4">
                {/* Show OTP input only for phone reset */}
                {authType === "phone" && (
                  <div className="space-y-2">
                    <Label htmlFor="reset-otp">رمز التحقق</Label>
                    <Input 
                      id="reset-otp" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                      placeholder="أدخل الرمز المرسل إلى هاتفك"
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="pl-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="pl-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={authType === "phone" ? handleResetPasswordWithOtp : handleUpdatePasswordFromEmail} 
                  disabled={loading}
                >
                  {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                </Button>
                
                <Button variant="outline" className="w-full" onClick={() => {
                  setMode("login");
                  setNewPassword("");
                  setConfirmPassword("");
                  setOtp("");
                }}>
                  العودة لتسجيل الدخول
                </Button>
              </div>
            )}
            
            {mode === "verify" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">رمز التحقق</Label>
                  <Input 
                    id="otp" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="أدخل الرمز المرسل إلى هاتفك"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? "جاري التحقق..." : "تحقق"}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOtp({
                        phone,
                        options: { shouldCreateUser: false }
                      });
                      setLoading(false);
                      if (error) {
                        toast({ 
                          title: "خطأ", 
                          description: error.message, 
                          variant: "destructive" 
                        });
                      } else {
                        setResendCountdown(60);
                        setCanResend(false);
                        toast({ 
                          title: "تم إعادة الإرسال", 
                          description: "تم إرسال رمز جديد إلى هاتفك" 
                        });
                      }
                    }}
                    disabled={loading || !canResend}
                  >
                    {resendCountdown > 0 
                      ? `إعادة الإرسال (${resendCountdown})` 
                      : "إعادة الإرسال"
                    }
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setMode("signup")}>
                    رجوع
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Tabs value={authType} onValueChange={(value) => setAuthType(value as "email" | "phone")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الهاتف
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4 mt-4">
                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="example@domain.com"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          placeholder="••••••••"
                          className="pl-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {mode === "login" && (
                      <Button 
                        variant="link" 
                        type="button"
                        className="text-sm text-primary p-0 h-auto"
                        onClick={() => setMode("forgot-password")}
                      >
                        نسيت كلمة المرور؟
                      </Button>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="phone" className="space-y-4 mt-4">
                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <PhoneInputWithCountry
                        value={phone}
                        onChange={setPhone}
                        placeholder="501234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          placeholder="••••••••"
                          className="pl-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {mode === "login" && (
                      <Button 
                        variant="link" 
                        type="button"
                        className="text-sm text-primary p-0 h-auto"
                        onClick={() => setMode("forgot-password")}
                      >
                        نسيت كلمة المرور؟
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
                
                {mode === "signup" && (
                  <>
                    {/* Referral Code Input */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="referralCode" className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        كود الإحالة (اختياري)
                      </Label>
                      <div className="relative">
                        <Input
                          id="referralCode"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="أدخل كود الإحالة للحصول على 7 أيام مجانية"
                          className="text-center uppercase tracking-widest pr-10"
                          maxLength={8}
                          dir="ltr"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          {checkingReferral && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {!checkingReferral && referralValid === true && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {!checkingReferral && referralValid === false && (
                            <X className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                      {referralValid === true && (
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          ستحصل على 7 أيام مجانية عند التسجيل!
                        </p>
                      )}
                      {referralValid === false && referralCode && (
                        <p className="text-xs text-destructive">
                          كود الإحالة غير صالح
                        </p>
                      )}
                    </div>
                    
                    <PrivacyPolicyCheckbox
                      checked={privacyAccepted}
                      onCheckedChange={setPrivacyAccepted}
                      className="my-4"
                    />
                  </>
                )}
                
                <Button className="w-full" onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading}>
                  {loading ? "جاري المعالجة..." : mode === "login" ? "دخول" : "إنشاء حساب"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
