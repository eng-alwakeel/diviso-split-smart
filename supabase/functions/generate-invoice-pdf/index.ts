import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Generate HTML invoice template
function generateInvoiceHtml(invoice: any, items: any[]): string {
  const isVatApplicable = invoice.vat_rate > 0;
  const showQrCode = isVatApplicable && invoice.qr_base64;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ${invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-section {
      text-align: right;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 5px;
    }
    .logo-sub {
      font-size: 14px;
      color: #666;
    }
    .invoice-info {
      text-align: left;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-title-en {
      font-size: 16px;
      color: #666;
      font-weight: normal;
    }
    .invoice-number {
      font-size: 14px;
      color: #6366f1;
      margin-bottom: 5px;
    }
    .invoice-date {
      font-size: 12px;
      color: #666;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party-box {
      width: 48%;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .party-title {
      font-size: 14px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 5px;
    }
    .party-detail {
      margin-bottom: 5px;
    }
    .party-label {
      color: #888;
      font-size: 11px;
    }
    .party-value {
      font-weight: 500;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #6366f1;
      color: #fff;
      padding: 12px 15px;
      text-align: right;
      font-weight: 600;
    }
    .items-table th:first-child {
      border-radius: 0 8px 0 0;
    }
    .items-table th:last-child {
      border-radius: 8px 0 0 0;
    }
    .items-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e0e0e0;
    }
    .items-table tr:nth-child(even) {
      background: #f8f9fa;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-box {
      width: 300px;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .total-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .total-row.grand {
      font-size: 18px;
      font-weight: bold;
      color: #6366f1;
      border-top: 2px solid #6366f1;
      padding-top: 10px;
    }
    .qr-section {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #e0e0e0;
    }
    .qr-title {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }
    .qr-code {
      width: 150px;
      height: 150px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #888;
      font-size: 11px;
    }
    .no-vat-notice {
      background: #fef3cd;
      border: 1px solid #ffc107;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      color: #856404;
    }
    .payment-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-paid {
      background: #d4edda;
      color: #155724;
    }
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }
    .bilingual {
      display: flex;
      flex-direction: column;
    }
    .bilingual .ar {
      font-weight: 500;
    }
    .bilingual .en {
      font-size: 10px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">ديفيزو</div>
        <div class="logo-sub">Diviso</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-title">
          فاتورة ضريبية
          <span class="invoice-title-en">Tax Invoice</span>
        </div>
        <div class="invoice-number">رقم الفاتورة: ${invoice.invoice_number}</div>
        <div class="invoice-date">تاريخ الإصدار: ${formatDate(invoice.issue_datetime)}</div>
        <div style="margin-top: 10px;">
          <span class="payment-status ${invoice.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">
            ${invoice.payment_status === 'paid' ? 'مدفوعة | Paid' : 'معلقة | Pending'}
          </span>
        </div>
      </div>
    </div>

    ${!isVatApplicable ? `
    <div class="no-vat-notice">
      <strong>ملاحظة:</strong> هذه الفاتورة معفاة من ضريبة القيمة المضافة (خارج المملكة العربية السعودية)
      <br><small>Note: This invoice is VAT-exempt (Outside Saudi Arabia)</small>
    </div>
    ` : ''}

    <div class="parties">
      <div class="party-box">
        <div class="party-title">
          <span class="bilingual">
            <span class="ar">معلومات البائع</span>
            <span class="en">Seller Information</span>
          </span>
        </div>
        <div class="party-detail">
          <span class="party-label">الاسم | Name:</span>
          <span class="party-value">${invoice.seller_legal_name}</span>
        </div>
        ${invoice.seller_vat_number ? `
        <div class="party-detail">
          <span class="party-label">الرقم الضريبي | VAT Number:</span>
          <span class="party-value">${invoice.seller_vat_number}</span>
        </div>
        ` : ''}
        ${invoice.seller_address ? `
        <div class="party-detail">
          <span class="party-label">العنوان | Address:</span>
          <span class="party-value">${invoice.seller_address}</span>
        </div>
        ` : ''}
      </div>
      <div class="party-box">
        <div class="party-title">
          <span class="bilingual">
            <span class="ar">معلومات المشتري</span>
            <span class="en">Buyer Information</span>
          </span>
        </div>
        <div class="party-detail">
          <span class="party-label">الاسم | Name:</span>
          <span class="party-value">${invoice.buyer_name || 'غير محدد'}</span>
        </div>
        ${invoice.buyer_email ? `
        <div class="party-detail">
          <span class="party-label">البريد الإلكتروني | Email:</span>
          <span class="party-value">${invoice.buyer_email}</span>
        </div>
        ` : ''}
        ${invoice.buyer_phone ? `
        <div class="party-detail">
          <span class="party-label">رقم الهاتف | Phone:</span>
          <span class="party-value">${invoice.buyer_phone}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الوصف | Description</th>
          <th>الكمية | Qty</th>
          <th>السعر | Price</th>
          ${isVatApplicable ? '<th>الضريبة | VAT</th>' : ''}
          <th>المجموع | Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div class="bilingual">
              <span class="ar">${item.description_ar || item.description}</span>
              <span class="en">${item.description}</span>
            </div>
          </td>
          <td>${item.quantity}</td>
          <td>${formatAmount(item.unit_price_excl_vat)} ${invoice.currency}</td>
          ${isVatApplicable ? `<td>${formatAmount(item.vat_amount || 0)} ${invoice.currency}</td>` : ''}
          <td>${formatAmount(item.line_total_incl_vat)} ${invoice.currency}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span>المجموع الفرعي | Subtotal:</span>
          <span>${formatAmount(invoice.total_excl_vat)} ${invoice.currency}</span>
        </div>
        ${isVatApplicable ? `
        <div class="total-row">
          <span>ضريبة القيمة المضافة (${(invoice.vat_rate * 100).toFixed(0)}%) | VAT:</span>
          <span>${formatAmount(invoice.total_vat)} ${invoice.currency}</span>
        </div>
        ` : ''}
        <div class="total-row grand">
          <span>الإجمالي | Total:</span>
          <span>${formatAmount(invoice.total_incl_vat)} ${invoice.currency}</span>
        </div>
      </div>
    </div>

    ${showQrCode ? `
    <div class="qr-section">
      <div class="qr-title">رمز ZATCA للتحقق | ZATCA Verification QR Code</div>
      <img class="qr-code" src="data:image/png;base64,${invoice.qr_base64}" alt="QR Code" />
    </div>
    ` : ''}

    <div class="footer">
      <p>شكراً لاستخدامكم ديفيزو | Thank you for using Diviso</p>
      <p>www.diviso.app</p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  console.log('=== Generate Invoice PDF ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoice_id, return_html } = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'Missing invoice_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice with items
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

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice_id);

    if (itemsError) {
      console.warn('Failed to fetch invoice items:', itemsError);
    }

    // Generate HTML
    const html = generateInvoiceHtml(invoice, items || []);

    // If only HTML is requested (for preview), return it directly
    if (return_html) {
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // For PDF generation, we return the HTML that can be converted client-side
    // or use a PDF service. For now, we return HTML with instructions.
    // In production, you might want to use a service like Puppeteer, wkhtmltopdf, etc.
    
    // Store HTML in storage bucket for PDF conversion
    const fileName = `invoices/${invoice.user_id}/${invoice.invoice_number}.html`;
    
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, new Blob([html], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.warn('Failed to upload HTML to storage:', uploadError);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        html_url: urlData?.publicUrl,
        html_content: html,
        message: 'Invoice HTML generated successfully. Use browser print to PDF or a PDF service for conversion.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate invoice', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
