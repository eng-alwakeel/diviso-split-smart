import { useEffect, useState } from "react";
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
import { Mail, Phone, Facebook, Twitter } from "lucide-react";
import { PrivacyPolicyCheckbox } from "@/components/ui/privacy-policy-checkbox";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startTrial } = useSubscription();
  const [mode, setMode] = useState<"login" | "signup" | "verify">("login");
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
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
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
      return;
    }
    
    setLoading(false);
    
    if (authType === "email") {
      toast({ 
        title: "تحقق من بريدك الإلكتروني", 
        description: "تم إرسال رابط التحقق إلى بريدك الإلكتروني"
      });
    } else {
      setMode("verify");
      toast({ 
        title: "تم إرسال رمز التحقق", 
        description: "أدخل الرمز المرسل إلى رقم هاتفك" 
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
              {mode === "login" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء حساب" : 
               authType === "phone" ? "تحقق من رقم الهاتف" : "تحقق من البريد الإلكتروني"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode !== "verify" && (
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleSocialLogin('google')}
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

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={loading}
                >
                  <Facebook className="w-5 h-5" fill="#1877F2" />
                  الدخول بحساب Facebook
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleSocialLogin('twitter')}
                  disabled={loading}
                >
                  <Twitter className="w-5 h-5" fill="#1DA1F2" />
                  الدخول بحساب Twitter
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
                <Button variant="outline" className="w-full" onClick={() => setMode("signup")}>
                  رجوع
                </Button>
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
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                      />
                    </div>
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
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="+966501234567" 
                        dir="ltr" 
                        className="text-left" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                {mode === "signup" && (
                  <PrivacyPolicyCheckbox
                    checked={privacyAccepted}
                    onCheckedChange={setPrivacyAccepted}
                    className="my-4"
                  />
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
