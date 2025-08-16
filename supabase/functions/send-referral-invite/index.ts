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
    console.log(`Sending referral invite to: ${phone} from: ${senderName} with code: ${referralCode}`);

    if (!phone || !senderName || !referralCode) {
      throw new Error("Missing required parameters: phone, senderName, or referralCode");
    }

    // Validate Saudi phone number format
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error("Invalid Saudi phone number format. Must be 05xxxxxxxx");
    }

    // Create the referral invite message in Arabic
    const inviteLink = `https://iwthriddasxzbjddpzzf.supabase.co/join/${referralCode}`;
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

    console.log("SMS Message to be sent:");
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);

    // For now, we'll simulate SMS sending success
    // In production, integrate with your SMS service provider (Twilio, AWS SNS, etc.)
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log the SMS sending attempt (replace with actual SMS service in production)
    console.log("📱 SMS Invite Details:");
    console.log(`Recipient: ${phone}`);
    console.log(`Sender: ${senderName}`);
    console.log(`Referral Code: ${referralCode}`);
    console.log(`Invite Link: ${inviteLink}`);

    // Here you would integrate with your SMS service
    /*
    // Example with Twilio:
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (twilioSid && twilioToken && twilioFrom) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = btoa(`${twilioSid}:${twilioToken}`);
      
      const smsResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioFrom,
          Body: message,
        }),
      });
      
      if (!smsResponse.ok) {
        const error = await smsResponse.text();
        console.error("Twilio SMS error:", error);
        throw new Error(`SMS sending failed: ${error}`);
      }
      
      console.log("SMS sent successfully via Twilio");
    }
    */

    console.log("✅ Referral invite processed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم إرسال دعوة الإحالة بنجاح",
        inviteLink,
        phoneValidated: true
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