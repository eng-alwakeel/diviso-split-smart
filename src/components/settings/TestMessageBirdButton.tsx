import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TestMessageBirdButton() {
  const [phone, setPhone] = useState("+966");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testMessageBird = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم هاتف صحيح",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("🧪 اختبار MessageBird للرقم:", phone);
      
      const { data, error } = await supabase.functions.invoke("test-messagebird", {
        body: { phone },
      });

      console.log("📊 نتيجة الاختبار:", { data, error });

      if (error) {
        throw error;
      }

      setResult(data);

      if (data.success) {
        toast({
          title: "✅ MessageBird يعمل!",
          description: "تحقق من هاتفك لاستلام رسالة الاختبار",
        });
      } else {
        toast({
          title: "❌ MessageBird لا يعمل",
          description: data.details?.error?.message || "حدث خطأ",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ خطأ في اختبار MessageBird:", error);
      toast({
        title: "خطأ في الاختبار",
        description: error.message,
        variant: "destructive",
      });
      setResult({
        success: false,
        error: error.message,
        recommendations: ["حدث خطأ في الاتصال بالخادم"],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-accent" />
          اختبار MessageBird
        </CardTitle>
        <CardDescription>
          تحقق من إعداد MessageBird عن طريق إرسال رسالة اختبار
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-phone">رقم الهاتف للاختبار</Label>
          <Input
            id="test-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+966501234567"
            dir="ltr"
            className="text-left"
          />
          <p className="text-xs text-muted-foreground">
            سيتم إرسال رسالة اختبار لهذا الرقم
          </p>
        </div>

        <Button
          onClick={testMessageBird}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري الاختبار...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 mr-2" />
              اختبار MessageBird
            </>
          )}
        </Button>

        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.success
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <p
                  className={`font-semibold ${
                    result.success
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {result.success ? "الاختبار نجح ✅" : "الاختبار فشل ❌"}
                </p>

                {result.recommendations && result.recommendations.length > 0 && (
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    {result.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                )}

                {result.details?.error && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer text-muted-foreground">
                      تفاصيل الخطأ التقنية
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.details.error, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-1">
          <p className="font-semibold">📝 ملاحظات:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>MessageBird يجب أن يكون مفعل في Supabase Dashboard</li>
            <li>تأكد من إضافة API Key الصحيح</li>
            <li>الرسالة قد تستغرق حتى دقيقتين للوصول</li>
            <li>تحقق من رصيد MessageBird الخاص بك</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
