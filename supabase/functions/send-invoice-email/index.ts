import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Legal seller name
const SELLER_LEGAL_NAME = "مؤسسة تكامل البناء";

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

// XML-RPC helper for Odoo
async function xmlRpcCall(url: string, method: string, params: any[]): Promise<any> {
  const xmlBody = `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${params.map(p => valueToXml(p)).join('\n    ')}
  </params>
</methodCall>`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xmlBody,
  });

  const text = await response.text();
  
  if (!response.ok) {
    throw new Error(`XML-RPC request failed: ${response.status}`);
  }

  return parseXmlRpcResponse(text);
}

function valueToXml(value: any): string {
  if (value === null || value === undefined) {
    return '<param><value><boolean>0</boolean></value></param>';
  }
  if (typeof value === 'boolean') {
    return `<param><value><boolean>${value ? 1 : 0}</boolean></value></param>`;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `<param><value><int>${value}</int></value></param>`;
    }
    return `<param><value><double>${value}</double></value></param>`;
  }
  if (typeof value === 'string') {
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<param><value><string>${escaped}</string></value></param>`;
  }
  if (Array.isArray(value)) {
    const items = value.map(v => valueToXmlInner(v)).join('');
    return `<param><value><array><data>${items}</data></array></value></param>`;
  }
  if (typeof value === 'object') {
    const members = Object.entries(value)
      .map(([k, v]) => `<member><name>${k}</name>${valueToXmlInner(v)}</member>`)
      .join('');
    return `<param><value><struct>${members}</struct></value></param>`;
  }
  return `<param><value><string>${String(value)}</string></value></param>`;
}

function valueToXmlInner(value: any): string {
  if (value === null || value === undefined) {
    return '<value><boolean>0</boolean></value>';
  }
  if (typeof value === 'boolean') {
    return `<value><boolean>${value ? 1 : 0}</boolean></value>`;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `<value><int>${value}</int></value>`;
    }
    return `<value><double>${value}</double></value>`;
  }
  if (typeof value === 'string') {
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<value><string>${escaped}</string></value>`;
  }
  if (Array.isArray(value)) {
    return `<value><array><data>${value.map(v => valueToXmlInner(v)).join('')}</data></array></value>`;
  }
  if (typeof value === 'object') {
    const members = Object.entries(value)
      .map(([k, v]) => `<member><name>${k}</name>${valueToXmlInner(v)}</member>`)
      .join('');
    return `<value><struct>${members}</struct></value>`;
  }
  return `<value><string>${String(value)}</string></value>`;
}

function parseXmlRpcResponse(xml: string): any {
  const faultMatch = xml.match(/<fault>([\s\S]*?)<\/fault>/);
  if (faultMatch) {
    const faultString = xml.match(/<name>faultString<\/name>\s*<value>(?:<string>)?([\s\S]*?)(?:<\/string>)?<\/value>/);
    throw new Error(`XML-RPC Fault: ${faultString?.[1] || 'Unknown error'}`);
  }

  const valueMatch = xml.match(/<params>\s*<param>\s*<value>([\s\S]*?)<\/value>\s*<\/param>\s*<\/params>/);
  if (!valueMatch) return null;

  return parseXmlValue(valueMatch[1]);
}

function parseXmlValue(xml: string): any {
  xml = xml.trim();
  
  const intMatch = xml.match(/^<(?:int|i4)>([-\d]+)<\/(?:int|i4)>$/);
  if (intMatch) return parseInt(intMatch[1], 10);

  const doubleMatch = xml.match(/^<double>([-\d.]+)<\/double>$/);
  if (doubleMatch) return parseFloat(doubleMatch[1]);

  const boolMatch = xml.match(/^<boolean>([01])<\/boolean>$/);
  if (boolMatch) return boolMatch[1] === '1';

  const stringMatch = xml.match(/^<string>([\s\S]*?)<\/string>$/);
  if (stringMatch) return stringMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  if (!xml.startsWith('<')) return xml;

  if (xml.startsWith('<array>')) {
    const dataMatch = xml.match(/^<array>\s*<data>([\s\S]*)<\/data>\s*<\/array>$/);
    if (dataMatch) {
      const values: any[] = [];
      const content = dataMatch[1];
      const valueRegex = /<value>([\s\S]*?)<\/value>/g;
      let match;
      while ((match = valueRegex.exec(content)) !== null) {
        values.push(parseXmlValue(match[1]));
      }
      return values;
    }
  }

  if (xml.startsWith('<struct>')) {
    const obj: any = {};
    const memberRegex = /<member>\s*<name>([\s\S]*?)<\/name>\s*<value>([\s\S]*?)<\/value>\s*<\/member>/g;
    let match;
    while ((match = memberRegex.exec(xml)) !== null) {
      obj[match[1]] = parseXmlValue(match[2]);
    }
    return obj;
  }

  return xml;
}

// Fetch QR code from Odoo for a specific invoice
async function fetchQrFromOdoo(invoiceNumber: string): Promise<string | null> {
  const odooUrl = Deno.env.get('ODOO_URL');
  const odooDb = Deno.env.get('ODOO_DB');
  const odooUsername = Deno.env.get('ODOO_USERNAME');
  const odooApiKey = Deno.env.get('ODOO_API_KEY');

  if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
    console.log('Odoo not configured, cannot fetch QR');
    return null;
  }

  try {
    console.log('Fetching QR code from Odoo for invoice:', invoiceNumber);
    
    // Authenticate with Odoo
    const commonUrl = `${odooUrl}/xmlrpc/2/common`;
    const uid = await xmlRpcCall(commonUrl, 'authenticate', [odooDb, odooUsername, odooApiKey, {}]);
    
    if (!uid) {
      console.warn('Odoo authentication failed');
      return null;
    }

    const objectUrl = `${odooUrl}/xmlrpc/2/object`;

    // Search for invoice by reference or name
    const invoices = await xmlRpcCall(objectUrl, 'execute_kw', [
      odooDb, uid, odooApiKey,
      'account.move', 'search_read',
      [[['name', 'ilike', invoiceNumber]]],
      { fields: ['id', 'name', 'state', 'l10n_sa_qr_code_str'], limit: 1 }
    ]);

    if (invoices && invoices.length > 0) {
      const qrCode = invoices[0].l10n_sa_qr_code_str;
      if (qrCode) {
        console.log('Found QR code from Odoo for invoice:', invoiceNumber);
        return qrCode;
      }
    }

    console.log('No QR code found in Odoo for invoice:', invoiceNumber);
    return null;
  } catch (error) {
    console.warn('Error fetching QR from Odoo:', error.message);
    return null;
  }
}

// Generate email HTML
function generateEmailHtml(invoice: any, items: any[], qrBase64: string | null): string {
  const isVatApplicable = invoice.vat_rate > 0;
  const showQrCode = isVatApplicable && qrBase64;

  // Use legal seller name
  const sellerName = SELLER_LEGAL_NAME;

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
          ${sellerName}<br>
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

    // Determine QR code to use
    const isVatApplicable = invoice.vat_rate > 0;
    let qrBase64 = invoice.qr_base64;

    // If no QR code stored and VAT applies, try to fetch from Odoo
    if (!qrBase64 && isVatApplicable) {
      console.log('No QR code stored, attempting to fetch from Odoo...');
      const odooQr = await fetchQrFromOdoo(invoice.invoice_number);
      
      if (odooQr) {
        qrBase64 = odooQr;
        
        // Update the invoice with the fetched QR code
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ 
            qr_base64: odooQr, 
            qr_payload: odooQr,
            updated_at: new Date().toISOString() 
          })
          .eq('id', invoice_id);
        
        if (updateError) {
          console.warn('Failed to save QR code to invoice:', updateError);
        } else {
          console.log('Saved QR code from Odoo to invoice');
        }
      }
    }

    // Generate email HTML
    const emailHtml = generateEmailHtml(invoice, items || [], qrBase64);

    // Send email
    console.log('Sending email to:', invoice.buyer_email);
    
    const emailResponse = await resend.emails.send({
      from: 'Diviso <noreply@resend.dev>',
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
        qr_source: qrBase64 ? (invoice.qr_base64 ? 'stored' : 'odoo') : 'none',
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
