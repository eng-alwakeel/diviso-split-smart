import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen first, then get existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) navigate("/dashboard");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل الدخول" });
      navigate("/dashboard");
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    if (error) {
      setLoading(false);
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      // Ensure profile has name
      await supabase.from("profiles").update({ display_name: null, avatar_url: null, name }).eq("id", userId);
    }
    setLoading(false);
    toast({ title: "تم إنشاء الحساب", description: "تحقق من بريدك إن لزم" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="bg-card border border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button className="w-full" onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading}>
              {loading ? "جاري المعالجة..." : mode === "login" ? "دخول" : "إنشاء حساب"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
