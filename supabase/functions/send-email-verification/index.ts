import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationRequest {
  email: string;
  userName?: string;
}

// Generate a 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, userName }: EmailVerificationRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending verification email to: ${email} for user: ${user.id}`);

    // Generate OTP code
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Mark any existing unused codes as used
    await supabase
      .from('email_verification_codes')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        user_id: user.id,
        email: email,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate verification code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const displayName = userName || "المستخدم";

    // Professional Arabic email template
    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني - Diviso</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; direction: rtl;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                Diviso
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                ديفيزو - إدارة مصاريفك بذكاء
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 22px; font-weight: 600; text-align: center;">
                تأكيد البريد الإلكتروني
              </h2>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7; text-align: center;">
                مرحباً <strong style="color: #10b981;">${displayName}</strong>! 👋
              </p>
              
              <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 15px; line-height: 1.8; text-align: center;">
                لتأكيد بريدك الإلكتروني الجديد، يرجى استخدام رمز التحقق التالي:
              </p>

              <!-- OTP Code Box -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 32px 0;">
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px;">رمز التحقق</p>
                <p style="margin: 0; color: #059669; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">
                  ${otpCode}
                </p>
              </div>

              <!-- Timer Warning -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 13px;">
                  ⏱️ صالح لمدة <strong>10 دقائق</strong> فقط
                </p>
              </div>

              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                إذا لم تطلب تغيير بريدك الإلكتروني، يرجى تجاهل هذه الرسالة.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                © ${new Date().getFullYear()} Diviso - ديفيزو
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                المملكة العربية السعودية 🇸🇦
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Diviso <onboarding@resend.dev>",
      to: [email],
      subject: "تأكيد البريد الإلكتروني - Diviso",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send verification email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
