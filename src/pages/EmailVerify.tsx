import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

const EmailVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");
      const email = searchParams.get("email");

      console.log("Email verification - URL params:", { token: token?.substring(0, 10) + "...", type, email });

      // فحص المستخدم الحالي أولاً
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.user && session.user.email_confirmed_at) {
        console.log("User already verified");
        setStatus("success");
        toast({
          title: "حسابك مفعل بالفعل!",
          description: "يمكنك الانتقال إلى لوحة التحكم"
        });
        
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
        return;
      }

      if (!token || !type) {
        console.log("Missing token or type");
        setStatus("error");
        setErrorMessage("رابط التحقق غير صالح أو غير مكتمل");
        return;
      }

      try {
        console.log("Attempting email verification...");
        
        // التحقق من البريد الإلكتروني باستخدام token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
          ...(email && { email })
        });

        console.log("Verification result:", { data: !!data, error: error?.message });

        if (error) {
          console.error("Verification error:", error);
          setStatus("error");
          
          // رسائل خطأ محددة حسب نوع المشكلة
          if (error.message.includes("expired")) {
            setErrorMessage("انتهت صلاحية رابط التحقق. يرجى طلب رابط جديد.");
          } else if (error.message.includes("invalid") || error.message.includes("not found")) {
            setErrorMessage("رابط التحقق غير صالح أو تم استخدامه من قبل.");
          } else if (error.message.includes("already")) {
            setErrorMessage("تم التحقق من هذا الحساب مسبقاً.");
          } else {
            setErrorMessage(`خطأ في التحقق: ${error.message}`);
          }
        } else {
          console.log("Verification successful");
          setStatus("success");
          toast({
            title: "تم التحقق بنجاح!",
            description: "تم تفعيل حسابك بنجاح"
          });

          // إعادة التوجيه بعد 2 ثانية
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 2000);
        }
      } catch (error: any) {
        console.error("Unexpected error:", error);
        setStatus("error");
        setErrorMessage(`حدث خطأ غير متوقع: ${error.message || "خطأ في النظام"}`);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  const handleResendEmail = async () => {
    const email = searchParams.get("email");
    if (!email) {
      toast({
        title: "خطأ",
        description: "لا يمكن إعادة إرسال البريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) {
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم إرسال البريد الإلكتروني",
          description: "تحقق من صندوق الوارد الخاص بك"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة الإرسال",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="bg-card border border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
              {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              تحقق من البريد الإلكتروني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {status === "loading" && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  جاري التحقق من بريدك الإلكتروني...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-600">
                    تم التحقق بنجاح!
                  </h3>
                  <p className="text-muted-foreground">
                    تم تفعيل حسابك وسيتم توجيهك إلى لوحة التحكم
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  الانتقال إلى لوحة التحكم
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">
                    فشل في التحقق
                  </h3>
                  <p className="text-muted-foreground">
                    {errorMessage}
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    إعادة إرسال رابط التحقق
                  </Button>
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="w-full"
                  >
                    العودة لصفحة تسجيل الدخول
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

export default EmailVerify;