import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Mail, Phone, Loader2, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { PrivacyPolicyCheckbox } from "@/components/ui/privacy-policy-checkbox";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { SEO } from "@/components/SEO";

// Auth page should not be indexed by search engines
import { useTranslation } from "react-i18next";
import { PasswordRequirements, isPasswordValid } from "@/components/auth/PasswordRequirements";
import { SignupValueBanner } from "@/components/auth/SignupValueBanner";
import { SocialProofText } from "@/components/auth/SocialProofText";
import { trackGAEvent } from "@/hooks/useGoogleAnalytics";
const Auth = () => {
  const { toast, dismiss } = useToast();
  const navigate = useNavigate();
  const { startTrial } = useSubscription();
  const { t } = useTranslation(['auth', 'common']);
  const [mode, setMode] = useState<"login" | "signup" | "verify" | "forgot-password" | "reset-password" | "email-sent">("signup");
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
  
  // Email resend countdown states
  const [emailResendCountdown, setEmailResendCountdown] = useState(0);
  
  // Signup other options collapsed state
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  // Login other options collapsed state
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [canResendEmail, setCanResendEmail] = useState(true);
  

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

  // Countdown timer for resend email
  useEffect(() => {
    if (emailResendCountdown > 0) {
      const timer = setTimeout(() => {
        setEmailResendCountdown(emailResendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (emailResendCountdown === 0 && mode === "email-sent") {
      setCanResendEmail(true);
    }
  }, [emailResendCountdown, mode]);


  useEffect(() => {
    const location = window.location;
    const params = new URLSearchParams(location.search);
    const trialPlan = params.get("startTrial");
    const redirectTo = params.get("redirectTo") || "/dashboard";
    const joinToken = localStorage.getItem('joinToken');
    const phoneInviteToken = localStorage.getItem('phoneInviteToken');

    // Listen first, then get existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Track signup completion for email/Google users (SIGNED_IN event after signup)
        if (event === 'SIGNED_IN') {
          const isGoogleUser = session.user.app_metadata?.provider === 'google';
          const isEmailUser = session.user.app_metadata?.provider === 'email';
          
          // Only track signup_completed for new signups (created within last 60 seconds)
          const createdAt = new Date(session.user.created_at).getTime();
          const now = Date.now();
          const isNewSignup = (now - createdAt) < 60000; // 60 seconds
          
          if (isNewSignup) {
            trackGAEvent('signup_completed', {
              method: isGoogleUser ? 'google' : isEmailUser ? 'email' : 'unknown',
              source: params.get('redirect') || 'direct',
            });
          }
        }

        if (joinToken) {
          localStorage.removeItem('joinToken');
          window.location.href = `/i/${joinToken}`;
          return;
        }
        
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
        if (joinToken) {
          localStorage.removeItem('joinToken');
          window.location.href = `/i/${joinToken}`;
          return;
        }
        
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
        title: t('auth:toast.login_error'),
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
      toast({ title: t('auth:toast.login_error'), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t('auth:toast.login_success') });
    }
  };

  const handleSignup = async () => {
    if (!privacyAccepted) {
      toast({ 
        title: t('auth:messages.privacy_required'), 
        description: t('auth:messages.privacy_required_desc'),
        variant: "destructive" 
      });
      return;
    }

    // Validate password requirements
    if (!isPasswordValid(password)) {
      toast({
        title: t('auth:toast.signup_error'),
        description: t('auth:toast.password_requirements_not_met'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('🔵 Starting signup...', { authType, phone, email });
    
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
    
    const { data, error } = await supabase.auth.signUp(signUpData);
    
    if (error) {
      setLoading(false);
      console.error('❌ Signup error:', error);
      
      // Handle weak/known password error - may also indicate existing account
      if (error.message.includes('weak') || error.message.includes('Password is known') || error.message.includes('known to be weak')) {
        const toastResult = toast({
          title: t('auth:toast.weak_password'),
          description: t('auth:toast.weak_password_desc'),
          variant: "destructive",
        action: (
            <div className="flex flex-col gap-2 mt-2">
              <ToastAction 
                altText={t('auth:buttons.login')}
                onClick={() => { dismiss(toastResult.id); setMode("login"); }}
                className="w-full justify-center"
              >
                {t('auth:buttons.login')}
              </ToastAction>
              <ToastAction 
                altText={t('auth:buttons.forgot_password')}
                onClick={() => { dismiss(toastResult.id); setMode("forgot-password"); }}
                className="w-full justify-center"
              >
                {t('auth:buttons.forgot_password')}
              </ToastAction>
            </div>
          )
        });
        return;
      }
      
      let errorMessage = error.message;
      
      if (error.message.includes('SMS provider')) {
        errorMessage = t('auth:toast.sms_error');
      } else if (error.message.includes('User already registered')) {
        errorMessage = t('auth:toast.user_exists');
      }
      
      toast({ 
        title: t('auth:toast.signup_error'), 
        description: errorMessage, 
        variant: "destructive" 
      });
      return;
    }
    
    // Detect existing account (Supabase returns user with empty identities)
    if (data?.user?.identities?.length === 0) {
      setLoading(false);
      const toastResult = toast({
        title: t('auth:toast.account_exists'),
        description: t('auth:toast.account_exists_desc'),
        variant: "destructive",
        action: (
          <div className="flex flex-col gap-2 mt-2">
            <ToastAction 
              altText={t('auth:buttons.login')}
              onClick={() => { dismiss(toastResult.id); setMode("login"); }}
              className="w-full justify-center"
            >
              {t('auth:buttons.login')}
            </ToastAction>
            <ToastAction 
              altText={t('auth:buttons.forgot_password')}
              onClick={() => { dismiss(toastResult.id); setMode("forgot-password"); }}
              className="w-full justify-center"
            >
              {t('auth:buttons.forgot_password')}
            </ToastAction>
          </div>
        )
      });
      return;
    }
    
    
    setLoading(false);
    
    if (authType === "email") {
      console.log('✅ Email signup complete');
      // Switch to email-sent mode with resend functionality
      setMode("email-sent");
      setEmailResendCountdown(60);
      setCanResendEmail(false);
      toast({ 
        title: t('auth:toast.verify_email'), 
        description: t('auth:toast.verify_email_desc')
      });
    } else {
      console.log('✅ Phone signup complete - sending OTP...');
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false }
      });
      
      if (otpError) {
        console.error('❌ OTP send error:', otpError);
      } else {
        console.log('✅ OTP sent successfully');
      }
      
      setMode("verify");
      setResendCountdown(60);
      setCanResend(false);
      toast({ 
        title: t('auth:toast.otp_sent'), 
        description: t('auth:toast.otp_sent_desc')
      });
    }
  };

  // Handle resend email verification
  const handleResendEmail = async () => {
    if (!email || !canResendEmail) return;
    
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify`
      }
    });
    setLoading(false);
    
    if (error) {
      toast({
        title: t('common:error'),
        description: error.message,
        variant: "destructive"
      });
    } else {
      setEmailResendCountdown(60);
      setCanResendEmail(false);
      toast({
        title: t('auth:toast.email_resent'),
        description: t('auth:toast.email_resent_desc')
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
      toast({ title: t('auth:toast.verify_error'), description: error.message, variant: "destructive" });
    } else {
      // Track signup completion for phone users
      trackGAEvent('signup_completed', {
        method: 'phone',
        source: new URLSearchParams(window.location.search).get('redirect') || 'direct',
      });
      toast({ title: t('auth:toast.verify_success'), description: t('auth:toast.verify_success_desc') });
    }
  };

  const handleForgotPasswordEmail = async () => {
    if (!email) {
      toast({ title: t('common:error'), description: t('auth:fields.email'), variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    
    setLoading(false);
    if (error) {
      toast({ title: t('common:error'), description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: t('auth:toast.reset_sent'), 
        description: t('auth:toast.reset_sent_email') 
      });
    }
  };

  const handleForgotPasswordPhone = async () => {
    if (!phone) {
      toast({ title: t('common:error'), description: t('auth:fields.phone'), variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false }
    });
    
    setLoading(false);
    if (error) {
      toast({ title: t('common:error'), description: error.message, variant: "destructive" });
    } else {
      setMode("reset-password");
      toast({ 
        title: t('auth:toast.reset_sent'), 
        description: t('auth:toast.reset_sent_phone') 
      });
    }
  };

  const handleResetPasswordWithOtp = async () => {
    if (!otp) {
      toast({ title: t('common:error'), description: t('auth:fields.otp'), variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: t('common:error'), description: t('auth:toast.passwords_mismatch'), variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: t('common:error'), description: t('auth:toast.password_too_short'), variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    const { error: otpError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms'
    });
    
    if (otpError) {
      setLoading(false);
      toast({ title: t('common:error'), description: otpError.message, variant: "destructive" });
      return;
    }
    
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    
    setLoading(false);
    if (updateError) {
      toast({ title: t('common:error'), description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: t('auth:toast.password_updated'), description: t('auth:toast.password_updated_desc') });
      setMode("login");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
    }
  };

  // Handle password reset from email link (including Supabase email links with access_token)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // Check for access_token in URL hash (from Supabase email link)
    // Supabase auto-recovers the session when hash contains access_token
    if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
      setMode("reset-password");
      setAuthType("email"); // Email reset flow
      return;
    }
    
    // Check for mode parameter in URL
    const urlMode = params.get("mode");
    if (urlMode === "reset") {
      setMode("reset-password");
      setAuthType("email");
    } else if (urlMode === "login") {
      setMode("login");
    }
    // Any other mode (including no mode) stays as signup (default)
  }, []);

  const handleUpdatePasswordFromEmail = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: t('common:error'), description: t('auth:toast.passwords_mismatch'), variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: t('common:error'), description: t('auth:toast.password_too_short'), variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    setLoading(false);
    if (error) {
      toast({ title: t('common:error'), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t('auth:toast.password_updated'), description: t('auth:toast.password_updated_desc') });
      setMode("login");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/auth", { replace: true });
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return t('auth:title.login');
      case "signup": return t('auth:title.signup');
      case "forgot-password": return t('auth:title.forgot_password');
      case "reset-password": return t('auth:title.reset_password');
      case "verify": return authType === "phone" ? t('auth:title.verify_phone') : t('auth:title.verify_email');
      case "email-sent": return t('auth:title.verify_email');
      default: return t('auth:title.login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('auth:title.login')}
        description={t('auth:slogan')}
        noIndex={true}
        canonical="https://diviso.app/auth"
      />
      <AppHeader minimal />
      <div className="auth-container">
        <Card className="bg-card border border-border rounded-2xl">
          <CardHeader>
            <div className="flex flex-col items-center gap-3 mb-2">
              <img 
                src="/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png" 
                alt="Diviso Logo" 
                className="h-10 w-auto" 
                width={160} 
                height={40} 
              />
              <p className="text-xs text-muted-foreground font-medium">
                {t('auth:slogan')}
              </p>
            </div>
            <CardTitle className="text-center">
              {getTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ==================== SIGNUP MODE ==================== */}
            {mode === "signup" && (
              <div className="space-y-4">
                {/* Value Proposition Banner */}
                <SignupValueBanner />
                
                {/* Google Button - Primary CTA */}
                <Button
                  variant="default"
                  className="w-full h-14 text-base font-medium flex items-center justify-center gap-2"
                  onClick={() => {
                    trackGAEvent('signup_google_clicked');
                    handleGoogleLogin();
                  }}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth:buttons.google_login_fast')}
                </Button>
                
                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('auth:messages.or')}</span>
                  </div>
                </div>
                
                {/* Other Signup Options - Collapsible */}
                <Collapsible 
                  open={showOtherOptions} 
                  onOpenChange={(open) => {
                    setShowOtherOptions(open);
                    if (open) {
                      trackGAEvent('signup_other_options_opened');
                    }
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      {t('auth:buttons.other_signup_options')}
                      {showOtherOptions ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-4 mt-4">
                    <Tabs value={authType} onValueChange={(value) => setAuthType(value as "email" | "phone")} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t('auth:tabs.email')}
                        </TabsTrigger>
                        <TabsTrigger value="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t('auth:tabs.phone')}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="email" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('auth:fields.name')}</Label>
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth:fields.name_placeholder')} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('auth:fields.email')}</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder={t('auth:fields.email_placeholder')}
                            dir="ltr"
                            className="text-left"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t('auth:fields.password')}</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"} 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              placeholder={t('auth:fields.password_placeholder')}
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
                          <PasswordRequirements password={password} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="phone" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('auth:fields.name')}</Label>
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth:fields.name_placeholder')} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t('auth:fields.phone')}</Label>
                          <PhoneInputWithCountry
                            value={phone}
                            onChange={setPhone}
                            placeholder={t('auth:fields.phone_placeholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t('auth:fields.password')}</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"} 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              placeholder={t('auth:fields.password_placeholder')}
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
                          <PasswordRequirements password={password} />
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    {/* Privacy Policy Checkbox */}
                    <div className="mt-4">
                      <PrivacyPolicyCheckbox
                        checked={privacyAccepted}
                        onCheckedChange={setPrivacyAccepted}
                      />
                    </div>
                    
                    {/* Signup Button */}
                    <Button 
                      className="w-full" 
                      onClick={handleSignup} 
                      disabled={loading || !privacyAccepted}
                    >
                      {loading ? t('auth:loading.signing_up') : t('auth:buttons.signup')}
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Social Proof */}
                <SocialProofText />
                
                {/* Login Link */}
                <p className="text-center text-sm">
                  {t('auth:buttons.has_account')}{" "}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setMode("login")}
                  >
                    {t('auth:buttons.login')}
                  </button>
                </p>
              </div>
            )}

            {/* Email Sent Mode */}
            {mode === "email-sent" && (
              <div className="space-y-4">
                <div className="text-center space-y-3 py-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('auth:messages.email_sent')}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium" dir="ltr">
                    {email}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleResendEmail}
                  disabled={loading || !canResendEmail}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : emailResendCountdown > 0 ? (
                    t('auth:messages.email_resend_countdown', { seconds: emailResendCountdown })
                  ) : (
                    t('auth:buttons.resend')
                  )}
                </Button>
                
                <Button variant="ghost" className="w-full" onClick={() => setMode("signup")}>
                  {t('auth:buttons.back')}
                </Button>
              </div>
            )}
            
            {/* Forgot Password Mode */}
            {mode === "forgot-password" && (
              <div className="space-y-4">
                <Tabs value={authType} onValueChange={(value) => setAuthType(value as "email" | "phone")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t('auth:tabs.email')}
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t('auth:tabs.phone')}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">{t('auth:fields.email')}</Label>
                      <Input 
                        id="reset-email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder={t('auth:fields.email_placeholder')}
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <Button className="w-full" onClick={handleForgotPasswordEmail} disabled={loading}>
                      {loading ? t('auth:loading.sending') : t('auth:buttons.send_reset_link')}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="phone" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-phone">{t('auth:fields.phone')}</Label>
                      <PhoneInputWithCountry
                        value={phone}
                        onChange={setPhone}
                        placeholder={t('auth:fields.phone_placeholder')}
                      />
                    </div>
                    <Button className="w-full" onClick={handleForgotPasswordPhone} disabled={loading}>
                      {loading ? t('auth:loading.sending') : t('auth:buttons.send_otp')}
                    </Button>
                  </TabsContent>
                </Tabs>
                
                <Button variant="outline" className="w-full" onClick={() => setMode("login")}>
                  {t('auth:buttons.back_to_login')}
                </Button>
              </div>
            )}
            
            {/* Reset Password Mode */}
            {mode === "reset-password" && (
              <div className="space-y-4">
                {authType === "phone" && (
                  <div className="space-y-2">
                    <Label htmlFor="reset-otp">{t('auth:fields.otp')}</Label>
                    <Input 
                      id="reset-otp" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                      placeholder={t('auth:fields.otp_placeholder')}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('auth:fields.new_password')}</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder={t('auth:fields.password_placeholder')}
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
                  <Label htmlFor="confirm-password">{t('auth:fields.confirm_password')}</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder={t('auth:fields.password_placeholder')}
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
                  {loading ? t('auth:loading.updating') : t('auth:buttons.update_password')}
                </Button>
                
                <Button variant="outline" className="w-full" onClick={() => {
                  setMode("login");
                  setNewPassword("");
                  setConfirmPassword("");
                  setOtp("");
                }}>
                  {t('auth:buttons.back_to_login')}
                </Button>
              </div>
            )}
            
            {mode === "verify" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">{t('auth:fields.otp')}</Label>
                  <Input 
                    id="otp" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder={t('auth:fields.otp_placeholder')}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? t('auth:loading.verifying') : t('auth:buttons.verify')}
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
                          title: t('common:error'), 
                          description: error.message, 
                          variant: "destructive" 
                        });
                      } else {
                        setResendCountdown(60);
                        setCanResend(false);
                        toast({ 
                          title: t('auth:toast.otp_resent'), 
                          description: t('auth:toast.otp_resent_desc') 
                        });
                      }
                    }}
                    disabled={loading || !canResend}
                  >
                    {resendCountdown > 0 
                      ? t('auth:buttons.resend_countdown', { seconds: resendCountdown })
                      : t('auth:buttons.resend')
                    }
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setMode("signup")}>
                    {t('auth:buttons.back')}
                  </Button>
                </div>
              </>
            ) : null}
            
            {/* ==================== LOGIN MODE ==================== */}
            {mode === "login" && (
              <div className="space-y-4">
                {/* Reassurance Section */}
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('auth:login_reassurance.message')}
                  </p>
                </div>
                
                {/* Google Button - Primary CTA */}
                <Button
                  variant="default"
                  className="w-full h-14 text-base font-medium flex items-center justify-center gap-2"
                  onClick={() => {
                    trackGAEvent('login_google_clicked');
                    handleGoogleLogin();
                  }}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth:buttons.google_login_fast')}
                </Button>
                
                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('auth:messages.or')}</span>
                  </div>
                </div>
                
                {/* Other Login Options - Collapsible */}
                <Collapsible 
                  open={showLoginOptions} 
                  onOpenChange={(open) => {
                    setShowLoginOptions(open);
                    if (open) {
                      trackGAEvent('login_other_options_opened');
                    }
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      {t('auth:buttons.other_login_options')}
                      {showLoginOptions ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-4 mt-4">
                    <Tabs value={authType} onValueChange={(value) => setAuthType(value as "email" | "phone")} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t('auth:tabs.email')}
                        </TabsTrigger>
                        <TabsTrigger value="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t('auth:tabs.phone')}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="email" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('auth:fields.email')}</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder={t('auth:fields.email_placeholder')}
                            dir="ltr"
                            className="text-left"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t('auth:fields.password')}</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"} 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              placeholder={t('auth:fields.password_placeholder')}
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
                        <Button 
                          variant="link" 
                          type="button"
                          className="text-sm text-primary p-0 h-auto"
                          onClick={() => setMode("forgot-password")}
                        >
                          {t('auth:buttons.forgot_password')}
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="phone" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t('auth:fields.phone')}</Label>
                          <PhoneInputWithCountry
                            value={phone}
                            onChange={setPhone}
                            placeholder={t('auth:fields.phone_placeholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t('auth:fields.password')}</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"} 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              placeholder={t('auth:fields.password_placeholder')}
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
                        <Button 
                          variant="link" 
                          type="button"
                          className="text-sm text-primary p-0 h-auto"
                          onClick={() => setMode("forgot-password")}
                        >
                          {t('auth:buttons.forgot_password')}
                        </Button>
                      </TabsContent>
                    </Tabs>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleLogin} 
                      disabled={loading}
                    >
                      {loading ? t('auth:loading.logging_in') : t('auth:buttons.login')}
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* CTA to Signup */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-primary border-primary/30 hover:bg-primary/5"
                    onClick={() => {
                      trackGAEvent('login_to_signup_cta_clicked');
                      navigate('/auth?mode=signup&redirect=/create-group');
                    }}
                  >
                    {t('auth:buttons.create_account_cta')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
