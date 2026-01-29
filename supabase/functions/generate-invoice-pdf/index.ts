import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Legal seller name
const SELLER_LEGAL_NAME = "مؤسسة تكامل البناء";
const SELLER_LEGAL_NAME_EN = "Takamul Al-Bina Est.";

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

// Generate a placeholder QR code as base64 for testing (only used when in draft/test mode)
function generatePlaceholderQR(invoiceNumber: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
    <rect width="150" height="150" fill="white"/>
    <rect x="10" y="10" width="30" height="30" fill="#333"/>
    <rect x="110" y="10" width="30" height="30" fill="#333"/>
    <rect x="10" y="110" width="30" height="30" fill="#333"/>
    <rect x="15" y="15" width="20" height="20" fill="white"/>
    <rect x="115" y="15" width="20" height="20" fill="white"/>
    <rect x="15" y="115" width="20" height="20" fill="white"/>
    <rect x="20" y="20" width="10" height="10" fill="#333"/>
    <rect x="120" y="20" width="10" height="10" fill="#333"/>
    <rect x="20" y="120" width="10" height="10" fill="#333"/>
    <rect x="50" y="10" width="10" height="10" fill="#333"/>
    <rect x="70" y="10" width="10" height="10" fill="#333"/>
    <rect x="50" y="30" width="10" height="10" fill="#333"/>
    <rect x="60" y="40" width="10" height="10" fill="#333"/>
    <rect x="50" y="50" width="10" height="10" fill="#333"/>
    <rect x="70" y="50" width="10" height="10" fill="#333"/>
    <rect x="90" y="50" width="10" height="10" fill="#333"/>
    <rect x="50" y="70" width="10" height="10" fill="#333"/>
    <rect x="70" y="70" width="10" height="10" fill="#333"/>
    <rect x="90" y="70" width="10" height="10" fill="#333"/>
    <rect x="110" y="70" width="10" height="10" fill="#333"/>
    <rect x="130" y="70" width="10" height="10" fill="#333"/>
    <rect x="50" y="90" width="10" height="10" fill="#333"/>
    <rect x="70" y="90" width="10" height="10" fill="#333"/>
    <rect x="90" y="90" width="10" height="10" fill="#333"/>
    <rect x="110" y="90" width="10" height="10" fill="#333"/>
    <rect x="50" y="110" width="10" height="10" fill="#333"/>
    <rect x="70" y="110" width="10" height="10" fill="#333"/>
    <rect x="90" y="110" width="10" height="10" fill="#333"/>
    <rect x="110" y="110" width="10" height="10" fill="#333"/>
    <rect x="130" y="110" width="10" height="10" fill="#333"/>
    <rect x="50" y="130" width="10" height="10" fill="#333"/>
    <rect x="90" y="130" width="10" height="10" fill="#333"/>
    <rect x="110" y="130" width="10" height="10" fill="#333"/>
    <text x="75" y="85" font-size="6" text-anchor="middle" fill="#666">${invoiceNumber}</text>
  </svg>`;
  
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return base64;
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
    const items = value.map(v => {
      const inner = valueToXmlInner(v);
      return inner;
    }).join('');
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

// Balanced tag extraction for nested XML structures
function extractBalancedTag(xml: string, tagName: string, startPos: number = 0): { content: string; endPos: number } | null {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;
  
  const start = xml.indexOf(openTag, startPos);
  if (start === -1) return null;
  
  let depth = 1;
  let pos = start + openTag.length;
  
  while (depth > 0 && pos < xml.length) {
    const nextOpen = xml.indexOf(openTag, pos);
    const nextClose = xml.indexOf(closeTag, pos);
    
    if (nextClose === -1) return null;
    
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) {
        return {
          content: xml.substring(start + openTag.length, nextClose),
          endPos: nextClose + closeTag.length
        };
      }
      pos = nextClose + closeTag.length;
    }
  }
  return null;
}

function parseXmlRpcResponse(xml: string): any {
  const faultMatch = xml.match(/<fault>([\s\S]*?)<\/fault>/);
  if (faultMatch) {
    const faultString = xml.match(/<name>faultString<\/name>\s*<value>(?:<string>)?([\s\S]*?)(?:<\/string>)?<\/value>/);
    throw new Error(`XML-RPC Fault: ${faultString?.[1] || 'Unknown error'}`);
  }

  const valueResult = extractBalancedTag(xml, 'value');
  if (!valueResult) {
    console.log('No value found in response');
    return null;
  }

  return parseXmlValue(valueResult.content);
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
      let content = dataMatch[1];
      let pos = 0;
      
      while (pos < content.length) {
        const valueResult = extractBalancedTag(content, 'value', pos);
        if (!valueResult) break;
        values.push(parseXmlValue(valueResult.content));
        pos = valueResult.endPos;
      }
      return values;
    }
  }

  if (xml.startsWith('<struct>')) {
    const structMatch = xml.match(/^<struct>([\s\S]*)<\/struct>$/);
    if (structMatch) {
      const obj: any = {};
      let content = structMatch[1];
      let pos = 0;
      
      while (pos < content.length) {
        const memberResult = extractBalancedTag(content, 'member', pos);
        if (!memberResult) break;
        
        const nameMatch = memberResult.content.match(/<name>([\s\S]*?)<\/name>/);
        const valueResult = extractBalancedTag(memberResult.content, 'value', 0);
        
        if (nameMatch && valueResult) {
          obj[nameMatch[1]] = parseXmlValue(valueResult.content);
        }
        pos = memberResult.endPos;
      }
      return obj;
    }
  }

  return xml;
}

// Fetch QR code from Odoo for a specific invoice
// Can search by: odoo_invoice_id (integer), odoo_invoice_name (INV/26/00001), or local invoice_number
async function fetchQrFromOdoo(
  odooInvoiceId: number | null, 
  odooInvoiceName: string | null, 
  localInvoiceNumber: string
): Promise<{ qrCode: string | null; odooId: number | null; odooName: string | null }> {
  const odooUrl = Deno.env.get('ODOO_URL');
  const odooDb = Deno.env.get('ODOO_DB');
  const odooUsername = Deno.env.get('ODOO_USERNAME');
  const odooApiKey = Deno.env.get('ODOO_API_KEY');

  if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
    console.log('Odoo not configured, cannot fetch QR');
    return { qrCode: null, odooId: null, odooName: null };
  }

  try {
    console.log('Fetching QR code from Odoo:', { odooInvoiceId, odooInvoiceName, localInvoiceNumber });
    
    // Authenticate with Odoo
    const commonUrl = `${odooUrl}/xmlrpc/2/common`;
    const uid = await xmlRpcCall(commonUrl, 'authenticate', [odooDb, odooUsername, odooApiKey, {}]);
    
    if (!uid) {
      console.warn('Odoo authentication failed');
      return { qrCode: null, odooId: null, odooName: null };
    }

    console.log('Odoo authentication successful, uid:', uid);
    const objectUrl = `${odooUrl}/xmlrpc/2/object`;

    let invoice = null;
    
    // Priority 1: Search by Odoo ID (most reliable)
    if (odooInvoiceId) {
      console.log('Searching Odoo by ID:', odooInvoiceId);
      const invoices = await xmlRpcCall(objectUrl, 'execute_kw', [
        odooDb, uid, odooApiKey,
        'account.move', 'search_read',
        [[['id', '=', odooInvoiceId]]],
        { fields: ['id', 'name', 'ref', 'state', 'l10n_sa_qr_code_str', 'move_type'], limit: 1 }
      ]);
      
      if (invoices && invoices.length > 0) {
        invoice = invoices[0];
        console.log('Found invoice by Odoo ID:', invoice.id, invoice.name);
      }
    }
    
    // Priority 2: Search by Odoo name (INV/26/00001 format)
    if (!invoice && odooInvoiceName) {
      console.log('Searching Odoo by name:', odooInvoiceName);
      const invoices = await xmlRpcCall(objectUrl, 'execute_kw', [
        odooDb, uid, odooApiKey,
        'account.move', 'search_read',
        [[['name', '=', odooInvoiceName]]],
        { fields: ['id', 'name', 'ref', 'state', 'l10n_sa_qr_code_str', 'move_type'], limit: 1 }
      ]);
      
      if (invoices && invoices.length > 0) {
        invoice = invoices[0];
        console.log('Found invoice by Odoo name:', invoice.id, invoice.name);
      }
    }
    
    // Priority 3: Search by ref (our local invoice number might be stored there)
    if (!invoice && localInvoiceNumber) {
      console.log('Searching Odoo by ref:', localInvoiceNumber);
      const invoices = await xmlRpcCall(objectUrl, 'execute_kw', [
        odooDb, uid, odooApiKey,
        'account.move', 'search_read',
        [[['ref', 'ilike', localInvoiceNumber]]],
        { fields: ['id', 'name', 'ref', 'state', 'l10n_sa_qr_code_str', 'move_type'], limit: 5 }
      ]);
      
      if (invoices && invoices.length > 0) {
        // Prefer posted invoices
        invoice = invoices.find((inv: any) => inv.state === 'posted') || invoices[0];
        console.log('Found invoice by ref:', invoice.id, invoice.name);
      }
    }

    if (invoice) {
      console.log('Odoo invoice found:', JSON.stringify({
        id: invoice.id,
        name: invoice.name,
        state: invoice.state,
        has_qr: !!invoice.l10n_sa_qr_code_str
      }));
      
      if (invoice.state !== 'posted') {
        console.log('Invoice not posted (state:', invoice.state, '). QR may not be available.');
      }
      
      const qrCode = invoice.l10n_sa_qr_code_str;
      if (qrCode && typeof qrCode === 'string' && qrCode.length > 10) {
        console.log('Found valid QR code from Odoo, length:', qrCode.length);
        return { qrCode, odooId: invoice.id, odooName: invoice.name };
      } else {
        console.log('Invoice found but QR code is empty or invalid');
        return { qrCode: null, odooId: invoice.id, odooName: invoice.name };
      }
    }

    console.log('No matching invoice found in Odoo');
    return { qrCode: null, odooId: null, odooName: null };
  } catch (error) {
    console.error('Error fetching QR from Odoo:', error.message);
    return { qrCode: null, odooId: null, odooName: null };
  }
}

// Generate HTML invoice template
function generateInvoiceHtml(invoice: any, items: any[], qrCode: string | null, isPlaceholder: boolean): string {
  const isVatApplicable = invoice.vat_rate > 0;
  const showQrCode = isVatApplicable && qrCode;

  // Use the legal seller name
  const sellerName = SELLER_LEGAL_NAME;

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
          <span class="party-value">${sellerName}</span>
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
      <div class="qr-title">
        رمز ZATCA للتحقق | ZATCA Verification QR Code
        ${isPlaceholder ? '<br><small style="color: #e67e22;">(نموذج تجريبي | Test Placeholder)</small>' : ''}
      </div>
      <img class="qr-code" src="data:image/${isPlaceholder ? 'svg+xml' : 'png'};base64,${qrCode}" alt="QR Code" />
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

    // Determine QR code to use
    const isVatApplicable = invoice.vat_rate > 0;
    let qrCode = invoice.qr_base64;
    let isPlaceholder = false;

    // If no QR code stored and VAT applies, try to fetch from Odoo
    if (!qrCode && isVatApplicable) {
      console.log('No QR code stored, attempting to fetch from Odoo...');
      console.log('Invoice Odoo data:', { 
        odoo_invoice_id: invoice.odoo_invoice_id, 
        odoo_invoice_name: invoice.odoo_invoice_name 
      });
      
      const result = await fetchQrFromOdoo(
        invoice.odoo_invoice_id || null,
        invoice.odoo_invoice_name || null,
        invoice.invoice_number
      );
      
      if (result.qrCode) {
        qrCode = result.qrCode;
        
        // Update the invoice with the fetched QR code and Odoo data
        const updateData: any = { 
          qr_base64: result.qrCode, 
          qr_payload: result.qrCode,
          updated_at: new Date().toISOString() 
        };
        
        // Also save Odoo ID/Name if we discovered them
        if (result.odooId && !invoice.odoo_invoice_id) {
          updateData.odoo_invoice_id = result.odooId;
        }
        if (result.odooName && !invoice.odoo_invoice_name) {
          updateData.odoo_invoice_name = result.odooName;
        }
        
        const { error: updateError } = await supabase
          .from('invoices')
          .update(updateData)
          .eq('id', invoice_id);
        
        if (updateError) {
          console.warn('Failed to save QR code to invoice:', updateError);
        } else {
          console.log('Saved QR code and Odoo data to invoice:', { 
            odooId: result.odooId, 
            odooName: result.odooName 
          });
        }
      } else {
        // Use placeholder only as last resort (for testing)
        console.log('Using placeholder QR code (Odoo QR not available)');
        qrCode = generatePlaceholderQR(invoice.invoice_number);
        isPlaceholder = true;
      }
    }

    // Generate HTML with correct seller name
    const html = generateInvoiceHtml(invoice, items || [], qrCode, isPlaceholder);

    // If only HTML is requested (for preview), return it directly
    if (return_html) {
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

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
        qr_source: isPlaceholder ? 'placeholder' : (qrCode ? 'odoo' : 'none'),
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
