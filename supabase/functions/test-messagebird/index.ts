import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestRequest {
  phone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone }: TestRequest = await req.json();

    console.log("🔍 Testing MessageBird configuration for phone:", phone);

    // إنشاء Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // محاولة إرسال OTP
    console.log("📤 Attempting to send OTP via Supabase Auth...");
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        shouldCreateUser: false,
      },
    });

    const result = {
      success: !error,
      timestamp: new Date().toISOString(),
      phone: phone,
      details: {
        supabaseUrl: supabaseUrl,
        hasData: !!data,
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name,
        } : null,
      },
      recommendations: [] as string[],
    };

    // تحليل الأخطاء وتقديم توصيات
    if (error) {
      console.error("❌ MessageBird test failed:", error);

      if (error.message.includes("SMS provider")) {
        result.recommendations.push(
          "MessageBird غير مفعل في Supabase",
          "اذهب إلى: Dashboard > Authentication > Providers > Phone",
          "تأكد من تفعيل MessageBird وإضافة API Key"
        );
      } else if (error.message.includes("rate limit")) {
        result.recommendations.push(
          "تم تجاوز حد الإرسال",
          "انتظر بضع دقائق قبل المحاولة مرة أخرى"
        );
      } else if (error.message.includes("invalid")) {
        result.recommendations.push(
          "رقم الهاتف غير صحيح",
          "استخدم صيغة دولية: +966501234567"
        );
      } else {
        result.recommendations.push(
          "خطأ غير متوقع في MessageBird",
          "تحقق من سجلات Supabase Edge Functions",
          "تحقق من صحة MessageBird API Key"
        );
      }
    } else {
      console.log("✅ MessageBird test successful");
      result.recommendations.push(
        "MessageBird يعمل بشكل صحيح!",
        "يجب أن تستلم رسالة SMS خلال دقيقتين",
        "تحقق من رسائل SMS على الهاتف: " + phone
      );
    }

    return new Response(JSON.stringify(result), {
      status: error ? 500 : 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in test-messagebird function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        recommendations: [
          "حدث خطأ في الاختبار",
          "تحقق من سجلات Edge Functions في Supabase",
        ],
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
