import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML entity escaping function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface EmailInviteRequest {
  email: string;
  groupName: string;
  inviteLink: string;
  customMessage?: string;
  groupId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      throw new Error('خدمة البريد الإلكتروني غير متوفرة حالياً');
    }

    const resend = new Resend(resendApiKey);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { email, groupName, inviteLink, customMessage, groupId }: EmailInviteRequest = await req.json();

    if (!email || !groupName || !inviteLink || !groupId) {
      throw new Error('Missing required parameters');
    }

    // Sanitize all user inputs to prevent XSS
    const safeGroupName = escapeHtml(groupName);
    const safeCustomMessage = customMessage ? escapeHtml(customMessage) : '';
    const safeInviteLink = escapeHtml(inviteLink);

    console.log('Processing email invite for group:', safeGroupName);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check if user with this email already exists and is in the group
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id, display_name, name')
      .eq('display_name', email)
      .maybeSingle();

    if (existingProfile) {
      // Check if they're already in the group
      const { data: existingMember } = await supabaseClient
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existingMember) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'المستخدم عضو في المجموعة بالفعل',
            type: 'already_member'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Create the email content with sanitized inputs
    const subject = `دعوة للانضمام لمجموعة "${safeGroupName}" على ديفيزو`;
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>دعوة انضمام</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">ديفيزو</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">تطبيق تقسيم المصاريف</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">مرحباً!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0;">
              تمت دعوتك للانضمام لمجموعة <strong>"${safeGroupName}"</strong> على تطبيق ديفيزو لتقسيم المصاريف.
            </p>
            
            ${safeCustomMessage ? `
              <div style="background: #f8f9fa; border-right: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; color: #555; font-style: italic; line-height: 1.6;">
                  "${safeCustomMessage}"
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${safeInviteLink}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                        font-weight: bold; font-size: 16px;">
                انضم للمجموعة الآن
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; margin: 20px 0;">
              أو انسخ الرابط التالي والصقه في متصفحك:
            </p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e9ecef; word-break: break-all; text-align: center;">
              <a href="${safeInviteLink}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                ${safeInviteLink}
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">ما هو ديفيزو؟</h3>
              <p style="color: #666; line-height: 1.6; font-size: 14px; margin: 0;">
                ديفيزو هو تطبيق ذكي لتقسيم المصاريف بين الأصدقاء والعائلة. يمكنك إضافة المصاريف، 
                تتبع من دفع ماذا، وحساب التسويات المطلوبة بسهولة.
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email using Resend
    console.log('Sending email to:', email.substring(0, 3) + '***');
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Diviso <noreply@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      throw new Error(`فشل في إرسال البريد الإلكتروني: ${emailError.message}`);
    }

    console.log('Email sent successfully:', emailData?.id);

    // Create invite record in database
    const { error: inviteError } = await supabaseClient
      .from('invites')
      .insert({
        group_id: groupId,
        phone_or_email: email,
        created_by: user.id,
        invited_role: 'member',
        status: 'sent',
        invite_source: 'email'
      });

    if (inviteError) {
      console.error('Error creating invite record:', inviteError);
    }

    console.log('Email invite processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم إرسال دعوة بريد إلكتروني إلى ${email}`,
        type: 'email_sent',
        emailId: emailData?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Email invite error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'حدث خطأ غير متوقع',
        type: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
