import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format number to 2 decimal places
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate email HTML
function generateEmailHtml(invoice: any, items: any[]): string {
  const isVatApplicable = invoice.vat_rate > 0;
  const showQrCode = isVatApplicable && invoice.qr_base64;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ${invoice.invoice_number}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">ديفيزو</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Diviso</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #333; margin: 0 0 10px 0; font-size: 22px;">
          فاتورة ضريبية | Tax Invoice
        </h2>
        <p style="color: #6366f1; font-size: 16px; margin: 0; font-weight: 600;">
          ${invoice.invoice_number}
        </p>
        <p style="color: #888; font-size: 14px; margin: 10px 0 0 0;">
          ${formatDate(invoice.issue_datetime)}
        </p>
        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; ${invoice.payment_status === 'paid' ? 'background: #d4edda; color: #155724;' : 'background: #fff3cd; color: #856404;'}">
          ${invoice.payment_status === 'paid' ? 'مدفوعة | Paid' : 'معلقة | Pending'}
        </span>
      </div>

      ${!isVatApplicable ? `
      <div style="background: #fef3cd; border: 1px solid #ffc107; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0; color: #856404; font-size: 13px;">
          <strong>ملاحظة:</strong> هذه الفاتورة معفاة من ضريبة القيمة المضافة
          <br><small>Note: This invoice is VAT-exempt</small>
        </p>
      </div>
      ` : ''}

      <!-- Items Summary -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #6366f1; margin: 0 0 15px 0; font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">
          تفاصيل الطلب | Order Details
        </h3>
        ${items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e8e8e8;">
          <div>
            <p style="margin: 0; font-weight: 500; color: #333;">${item.description_ar || item.description}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">${item.description}</p>
          </div>
          <div style="text-align: left;">
            <p style="margin: 0; font-weight: 500; color: #333;">${formatAmount(item.line_total_incl_vat)} ${invoice.currency}</p>
          </div>
        </div>
        `).join('')}
      </div>

      <!-- Totals -->
      <div style="background: #f0f0ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #666;">المجموع الفرعي | Subtotal</span>
          <span style="color: #333; font-weight: 500;">${formatAmount(invoice.total_excl_vat)} ${invoice.currency}</span>
        </div>
        ${isVatApplicable ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #666;">ضريبة القيمة المضافة (${(invoice.vat_rate * 100).toFixed(0)}%) | VAT</span>
          <span style="color: #333; font-weight: 500;">${formatAmount(invoice.total_vat)} ${invoice.currency}</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #6366f1;">
          <span style="color: #6366f1; font-weight: bold; font-size: 18px;">الإجمالي | Total</span>
          <span style="color: #6366f1; font-weight: bold; font-size: 18px;">${formatAmount(invoice.total_incl_vat)} ${invoice.currency}</span>
        </div>
      </div>

      ${showQrCode ? `
      <!-- QR Code -->
      <div style="text-align: center; padding: 20px; border-top: 1px dashed #e0e0e0;">
        <p style="color: #888; font-size: 12px; margin: 0 0 10px 0;">رمز ZATCA للتحقق | ZATCA Verification QR Code</p>
        <img src="cid:qrcode" alt="QR Code" style="width: 120px; height: 120px;" />
      </div>
      ` : ''}

      <!-- Seller Info -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-top: 20px;">
        <h4 style="color: #6366f1; margin: 0 0 10px 0; font-size: 14px;">معلومات البائع | Seller Info</h4>
        <p style="margin: 0; color: #666; font-size: 13px;">
          ${invoice.seller_legal_name}<br>
          ${invoice.seller_vat_number ? `الرقم الضريبي: ${invoice.seller_vat_number}<br>` : ''}
          ${invoice.seller_address || ''}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #888; font-size: 12px; margin: 0;">
        شكراً لاستخدامكم ديفيزو | Thank you for using Diviso
      </p>
      <p style="color: #aaa; font-size: 11px; margin: 10px 0 0 0;">
        www.diviso.app
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  console.log('=== Send Invoice Email ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      throw new Error('Email service is not configured');
    }

    const resend = new Resend(resendApiKey);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'Missing invoice_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing invoice:', invoice_id);

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found', details: invoiceError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we have an email to send to
    if (!invoice.buyer_email) {
      return new Response(
        JSON.stringify({ error: 'No buyer email on invoice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice_id);

    if (itemsError) {
      console.warn('Failed to fetch invoice items:', itemsError);
    }

    // Generate email HTML
    const emailHtml = generateEmailHtml(invoice, items || []);

    // Prepare email attachments
    const attachments: any[] = [];
    
    // Add QR code as inline attachment if available
    if (invoice.qr_base64 && invoice.vat_rate > 0) {
      // QR code is base64 - we'll include it inline in the email
      // For now, we include it as a data URL in the HTML directly
    }

    // Send email
    console.log('Sending email to:', invoice.buyer_email);
    
    const emailResponse = await resend.emails.send({
      from: 'Diviso <noreply@resend.dev>', // Update to your verified domain
      to: [invoice.buyer_email],
      subject: `فاتورة ${invoice.invoice_number} | Invoice from Diviso`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    // Update invoice to track email sent
    await supabase
      .from('invoices')
      .update({
        notes: `Email sent at ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice email sent successfully',
        email_id: emailResponse.data?.id,
        sent_to: invoice.buyer_email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
