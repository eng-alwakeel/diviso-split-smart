import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;

function buildEmailHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center; }
    .header img { height: 40px; }
    .header h1 { color: #ffffff; font-size: 20px; margin: 16px 0 0; }
    .body { padding: 32px 24px; color: #333333; font-size: 16px; line-height: 1.8; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; }
    .footer a { color: #6366f1; text-decoration: none; }
    a { color: #6366f1; }
  </style>
</head>
<body>
  <div style="padding: 24px 16px;">
    <div class="container">
      <div class="header">
        <h1>ديفيزو | Diviso</h1>
      </div>
      <div class="body">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>هذا البريد مرسل من <a href="https://diviso-split-smart.lovable.app">ديفيزو</a></p>
        <p style="margin-top:8px;">© ${new Date().getFullYear()} Diviso. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: isAdmin, error: adminCheckError } = await supabaseUser.rpc("is_admin_user");
    if (adminCheckError || !isAdmin) {
      return new Response(JSON.stringify({ error: "غير مصرح لك بهذا الإجراء" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) throw new Error("User not found");

    const { subject, body_html, body_text, test_email } = await req.json();
    if (!subject || !body_html) {
      throw new Error("العنوان والمحتوى مطلوبان");
    }

    const resend = new Resend(resendApiKey);

    // --- Test email mode ---
    if (test_email) {
      const fullHtml = buildEmailHtml(body_html);
      try {
        await resend.emails.send({
          from: "Diviso <noreply@diviso.app>",
          to: [test_email],
          subject: `[تجربة] ${subject}`,
          html: fullHtml,
          text: body_text || undefined,
        });
        return new Response(
          JSON.stringify({ success: true, test: true, sent_to: test_email }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (err: any) {
        console.error("Test email error:", err);
        return new Response(
          JSON.stringify({ error: `فشل إرسال التجربة: ${err.message}` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // --- Broadcast mode ---
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all users with email
    const allUsers: { email: string }[] = [];
    let page = 1;
    const perPage = 1000;
    
    while (true) {
      const { data: { users: batch }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      
      if (listError) throw listError;
      if (!batch || batch.length === 0) break;
      
      for (const u of batch) {
        if (u.email) {
          allUsers.push({ email: u.email });
        }
      }
      
      if (batch.length < perPage) break;
      page++;
    }

    const totalRecipients = allUsers.length;
    console.log(`Found ${totalRecipients} recipients`);

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        subject,
        body_html,
        body_text: body_text || null,
        sent_by: user.id,
        total_recipients: totalRecipients,
        status: "sending",
      })
      .select("id")
      .single();

    if (campaignError) throw campaignError;

    // Send in batches
    let sentCount = 0;
    let failedCount = 0;
    const fullHtml = buildEmailHtml(body_html);

    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      const batch = allUsers.slice(i, i + BATCH_SIZE);
      const emails = batch.map((u) => u.email);

      try {
        // Send individually to avoid Resend batch limits
        const sendPromises = emails.map(async (email) => {
          try {
            await resend.emails.send({
              from: "Diviso <noreply@diviso.app>",
              to: [email],
              subject,
              html: fullHtml,
              text: body_text || undefined,
            });
            return { success: true };
          } catch (err) {
            console.error(`Failed to send to ${email.substring(0, 3)}***:`, err);
            return { success: false };
          }
        });

        const results = await Promise.all(sendPromises);
        sentCount += results.filter((r) => r.success).length;
        failedCount += results.filter((r) => !r.success).length;
      } catch (batchError) {
        console.error("Batch error:", batchError);
        failedCount += batch.length;
      }

      // Delay between batches
      if (i + BATCH_SIZE < allUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Update campaign with results
    const finalStatus = failedCount === totalRecipients ? "failed" : "completed";
    await supabaseAdmin
      .from("email_campaigns")
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: finalStatus,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    console.log(`Campaign ${campaign.id}: sent=${sentCount}, failed=${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        total_recipients: totalRecipients,
        sent_count: sentCount,
        failed_count: failedCount,
        status: finalStatus,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Broadcast email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
