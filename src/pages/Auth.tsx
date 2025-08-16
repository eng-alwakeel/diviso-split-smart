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
import { Mail, Phone } from "lucide-react";

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

  useEffect(() => {
    const location = window.location;
    const params = new URLSearchParams(location.search);
    const trialPlan = params.get("startTrial");
    const redirectTo = params.get("redirectTo") || "/dashboard";
    const joinToken = localStorage.getItem('joinToken');

    // Listen first, then get existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // إذا كان هناك joinToken، نعيد التوجيه للرابط المناسب
        if (joinToken) {
          localStorage.removeItem('joinToken');
          window.location.href = `/i/${joinToken}`;
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
    setLoading(true);
    
    const signUpData = authType === "email" 
      ? { 
          email, 
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/`
          }
        }
      : { 
          phone, 
          password,
          options: {
            data: { name }
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
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="bg-card border border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {mode === "login" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء حساب" : 
               authType === "phone" ? "تحقق من رقم الهاتف" : "تحقق من البريد الإلكتروني"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
