import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralInviteRequest {
  phone: string;
  senderName: string;
  referralCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Referral Invite Function Started ===");
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { phone, senderName, referralCode }: ReferralInviteRequest = await req.json();
    
    // Logging sanitized for security - no PII in production logs
    const isDev = Deno.env.get('ENVIRONMENT') === 'development';
    if (isDev) {
      console.log('Sending referral invite with code:', referralCode);
    }

    if (!phone || !senderName || !referralCode) {
      throw new Error("Missing required parameters: phone, senderName, or referralCode");
    }

    // Normalize phone number to 05xxxxxxxx format
    let normalizedPhone = phone;
    if (phone.startsWith('+966')) {
      normalizedPhone = '0' + phone.substring(4);
    } else if (phone.startsWith('966')) {
      normalizedPhone = '0' + phone.substring(3);
    }
    
    // Validate Saudi phone number format (now accepts 05xxxxxxxx format only)
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      throw new Error("Invalid Saudi phone number format. Must be 05xxxxxxxx, +966xxxxxxxx, or 966xxxxxxxx");
    }

    // Create the referral invite message in Arabic
    const siteUrl = Deno.env.get("SITE_URL") || "https://diviso.app";
    const inviteLink = `${siteUrl}/join/${referralCode}`;
    const message = `
🎉 مرحباً! 

تمت دعوتك من قِبل ${senderName} للانضمام إلى تطبيق إدارة المصروفات الذكي.

✨ احصل على 7 أيام مجانية من الباقة المميزة عند التسجيل!

📱 انضم الآن عبر الرابط:
${inviteLink}

💰 ميزات التطبيق:
• إدارة المصروفات الجماعية
• تقسيم الفواتير بذكاء
• تتبع الميزانيات
• تقارير مالية مفصلة

لا تفوت الفرصة! 🚀
    `.trim();

    // SMS details sanitized for security - no PII in production logs
    if (isDev) {
      console.log("SMS message prepared with referral code:", referralCode);
    }

    // Convert phone to international format for Twilio
    let internationalPhone = normalizedPhone;
    if (internationalPhone.startsWith('0')) {
      internationalPhone = '+966' + internationalPhone.substring(1);
    }

    // Send SMS via Twilio
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    let smsSent = false;
    
    if (twilioSid && twilioToken && twilioFrom) {
      console.log("📤 Attempting to send SMS via Twilio...");
      
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = btoa(`${twilioSid}:${twilioToken}`);
      
      const smsResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: internationalPhone,
          From: twilioFrom,
          Body: message,
        }),
      });
      
      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        console.error("❌ Twilio SMS error:", errorText);
        // Don't throw - still return success for the referral creation
      } else {
        const smsResult = await smsResponse.json();
        console.log("✅ SMS sent successfully via Twilio, SID:", smsResult.sid);
        smsSent = true;
      }
    } else {
      console.warn("⚠️ Twilio credentials not configured - SMS not sent");
    }

    console.log("✅ Referral invite processed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: smsSent ? "تم إرسال دعوة الإحالة بنجاح" : "تم إنشاء الإحالة (الرسالة قيد الإرسال)",
        inviteLink,
        phoneValidated: true,
        smsSent
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Error in send-referral-invite function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send referral invite",
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);