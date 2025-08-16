import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startTrial } = useSubscription();
  const [mode, setMode] = useState<"login" | "signup" | "verify">("login");
  const [phone, setPhone] = useState("");
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
    const { error } = await supabase.auth.signInWithPassword({ 
      phone, 
      password 
    });
    setLoading(false);
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل الدخول" });
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        data: { name }
      }
    });
    
    if (error) {
      setLoading(false);
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
      return;
    }
    
    setLoading(false);
    setMode("verify");
    toast({ title: "تم إرسال رمز التحقق", description: "أدخل الرمز المرسل إلى رقم هاتفك" });
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
              {mode === "login" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء حساب" : "تحقق من رقم الهاتف"}
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
                    placeholder="أدخل الرمز المرسل"
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
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" />
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
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
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
