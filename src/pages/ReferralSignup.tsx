import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Gift, UserPlus } from "lucide-react";

export default function ReferralSignup() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [referralData, setReferralData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const validateReferralCode = async () => {
      if (!referralCode) {
        toast.error("رمز الإحالة غير صالح");
        navigate("/auth");
        return;
      }

      try {
        // First check if the referral code exists and is valid
        const { data: codeData, error: codeError } = await supabase
          .from("user_referral_codes")
          .select(`
            *,
            profiles!user_referral_codes_user_id_fkey(name, display_name)
          `)
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (codeError) throw codeError;
        
        if (!codeData) {
          toast.error("رمز الإحالة غير صحيح");
          navigate("/auth");
          return;
        }

        // Check for active referral invitation
        const { data: referralInvite, error: referralError } = await supabase
          .from("referrals")
          .select("*")
          .eq("referral_code", referralCode)
          .eq("status", "pending")
          .maybeSingle();

        if (referralError) throw referralError;

        // If no referral invitation found, allow signup with the code
        if (!referralInvite) {
          setReferralData(codeData);
          setLoading(false);
          return;
        }

        // Check if the referral invitation has expired
        const now = new Date();
        const expiresAt = new Date(referralInvite.expires_at);
        
        if (now > expiresAt) {
          toast.error("انتهت صلاحية دعوة الإحالة. يرجى طلب دعوة جديدة.");
          navigate("/auth");
          return;
        }

        setReferralData(codeData);
      } catch (error) {
        console.error("Error validating referral code:", error);
        toast.error("خطأ في التحقق من رمز الإحالة");
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    validateReferralCode();
  }, [referralCode, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setSubmitting(true);

    try {
      // Sign up the user with email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: formData.name,
            display_name: formData.name,
            phone: formData.phone,
            referral_code: referralCode
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Process the referral signup
        const { error: referralError } = await supabase.functions.invoke('process-referral-signup', {
          body: {
            userId: authData.user.id,
            referralCode,
            userEmail: formData.email,
            userName: formData.name,
            userPhone: formData.phone
          }
        });

        if (referralError) {
          console.error("Referral processing error:", referralError);
          // Don't fail the signup if referral processing fails
        }

        toast.success("تم إنشاء الحساب بنجاح! مرحباً بك في عائلة المدخرين");
        
        // Redirect to dashboard after successful signup
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      if (error.message?.includes("User already registered")) {
        toast.error("هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول");
        navigate("/auth");
      } else {
        toast.error("خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحقق من رمز الإحالة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mb-4">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">انضم عبر الإحالة</CardTitle>
          <CardDescription>
            تمت دعوتك من قِبل{" "}
            <span className="font-medium text-primary">
              {referralData?.profiles?.display_name || referralData?.profiles?.name || "صديقك"}
            </span>
            <br />
            احصل على أيام مجانية عند التسجيل!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                id="name"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="05xxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="كلمة مرور قوية"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="أعد كتابة كلمة المرور"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-primary mb-2">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">مكافأة الإحالة</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ستحصل على <strong>7 أيام مجانية</strong> من الباقة المميزة عند إكمال التسجيل
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                "إنشاء حساب جديد"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              لديك حساب مسبقاً؟{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate("/auth")}
              >
                تسجيل الدخول
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}