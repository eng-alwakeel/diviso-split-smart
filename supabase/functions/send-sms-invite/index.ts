import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  phone: string;
  groupName: string;
  inviteLink: string;
  senderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, groupName, inviteLink, senderName }: SMSRequest = await req.json();

    // تكوين رسالة SMS بالعربية
    const message = `مرحباً! دعاك ${senderName} للانضمام إلى مجموعة "${groupName}" في تطبيق ديفيسو لتقسيم المصاريف. 

انقر على الرابط للانضمام:
${inviteLink}

أو قم بتحميل التطبيق من متجر التطبيقات واستخدم الرابط أعلاه.`;

    // في هذا المثال سنستخدم console.log فقط
    // يمكن تكامل مع خدمات SMS مثل Twilio, AWS SNS, إلخ
    console.log('SMS would be sent to:', phone);
    console.log('Message:', message);

    // TODO: إضافة تكامل حقيقي مع خدمة SMS
    // مثال للتكامل مع Twilio:
    /*
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phone,
        Body: message,
      }),
    });
    */

    // مؤقتاً نرجع نجاح وهمي
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إرسال الدعوة بنجاح',
        messageSent: message
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-sms-invite function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);