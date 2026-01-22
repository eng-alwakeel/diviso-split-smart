import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// XML-RPC helper for Odoo
async function xmlRpcCall(url: string, method: string, params: any[]): Promise<any> {
  const xmlBody = `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${params.map(p => `<param>${valueToXml(p)}</param>`).join('\n    ')}
  </params>
</methodCall>`;

  console.log(`XML-RPC Call to ${url}:`, method);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xmlBody,
  });

  const text = await response.text();
  
  if (!response.ok) {
    throw new Error(`XML-RPC request failed: ${response.status} - ${text}`);
  }

  return parseXmlRpcResponse(text);
}

function valueToXml(value: any): string {
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
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<value><string>${escaped}</string></value>`;
  }
  if (Array.isArray(value)) {
    return `<value><array><data>${value.map(v => valueToXml(v)).join('')}</data></array></value>`;
  }
  if (typeof value === 'object') {
    const members = Object.entries(value)
      .map(([k, v]) => `<member><name>${k}</name>${valueToXml(v)}</member>`)
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
  if (!valueMatch) {
    console.log('No value found in response:', xml);
    return null;
  }

  return parseXmlValue(valueMatch[1]);
}

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

// Check if user is Saudi based on phone number
function isSaudiUser(phone: string | null): boolean {
  if (!phone) return false;
  // Saudi phone codes: +966 or 00966
  const cleanPhone = phone.replace(/\s/g, '');
  return cleanPhone.startsWith('+966') || cleanPhone.startsWith('00966');
}

interface InvoiceRequest {
  user_id: string;
  purchase_type: 'subscription_monthly' | 'subscription_annual' | 'credits_pack';
  amount: number; // Amount in SAR (TAX-INCLUSIVE - the final price user pays)
  description?: string;
  payment_reference?: string;
  credit_purchase_id?: string;
  subscription_id?: string;
  draft_only?: boolean; // If true, don't post invoice (for testing)
}

serve(async (req) => {
  console.log('=== Odoo Create Invoice ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Odoo configuration
    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');
    const odooCompanyId = parseInt(Deno.env.get('ODOO_COMPANY_ID') || '0');
    const salesJournalId = parseInt(Deno.env.get('ODOO_SALES_JOURNAL_ID') || '0');
    const vatTaxId = parseInt(Deno.env.get('ODOO_VAT_TAX_ID') || '0');

    // Product mapping
    const productMapping: Record<string, number> = {
      'subscription_monthly': parseInt(Deno.env.get('ODOO_PRODUCT_MONTHLY_SUB_ID') || '0'),
      'subscription_annual': parseInt(Deno.env.get('ODOO_PRODUCT_ANNUAL_SUB_ID') || '0'),
      'credits_pack': parseInt(Deno.env.get('ODOO_PRODUCT_CREDITS_ID') || '0'),
    };

    // Validate configuration
    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey || !odooCompanyId) {
      throw new Error('Missing Odoo configuration');
    }

    // Parse request body
    const body: InvoiceRequest = await req.json();
    const { user_id, purchase_type, amount, description, payment_reference, credit_purchase_id, subscription_id, draft_only } = body;

    if (!user_id || !purchase_type || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, purchase_type, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productId = productMapping[purchase_type];
    if (!productId) {
      return new Response(
        JSON.stringify({ error: `Invalid purchase_type: ${purchase_type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    console.log('Fetching user profile:', user_id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, phone, odoo_partner_id')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`User profile not found: ${profileError?.message}`);
    }

    // Get user email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    const userEmail = authUser?.user?.email;

    console.log('User profile:', { name: profile.name, phone: profile.phone, email: userEmail });

    // Determine if user is Saudi (affects VAT and QR code)
    const isSaudi = isSaudiUser(profile.phone);
    console.log('User is Saudi:', isSaudi, '(phone:', profile.phone, ')');

    // Calculate amounts based on tax-inclusive pricing
    // The amount parameter is what the user pays (total including VAT for Saudi users)
    let amountExclVat: number;
    let vatAmount: number;
    let vatRate: number;
    let amountInclVat: number;

    if (isSaudi) {
      // Saudi users: 15% VAT included in price
      vatRate = 0.15;
      amountInclVat = amount;
      amountExclVat = amount / (1 + vatRate); // Extract subtotal from tax-inclusive price
      vatAmount = amountInclVat - amountExclVat;
    } else {
      // Non-Saudi users: No VAT, full amount is service fee
      vatRate = 0;
      amountExclVat = amount;
      vatAmount = 0;
      amountInclVat = amount;
    }

    console.log('Amount calculation:', {
      isSaudi,
      inputAmount: amount,
      amountExclVat: amountExclVat.toFixed(2),
      vatRate,
      vatAmount: vatAmount.toFixed(2),
      amountInclVat: amountInclVat.toFixed(2),
    });

    // Authenticate with Odoo
    console.log('Authenticating with Odoo...');
    const commonUrl = `${odooUrl}/xmlrpc/2/common`;
    const uid = await xmlRpcCall(commonUrl, 'authenticate', [odooDb, odooUsername, odooApiKey, {}]);
    
    if (!uid) {
      throw new Error('Odoo authentication failed');
    }
    console.log('Odoo authenticated, UID:', uid);

    const objectUrl = `${odooUrl}/xmlrpc/2/object`;

    // Step 1: Find or create partner in Odoo
    let partnerId = profile.odoo_partner_id;

    if (!partnerId) {
      console.log('Looking for existing partner by email/phone...');
      
      // Search for existing partner
      let searchDomain: any[] = [];
      if (userEmail) {
        searchDomain = [['email', '=', userEmail]];
      } else if (profile.phone) {
        searchDomain = [['phone', '=', profile.phone]];
      }

      if (searchDomain.length > 0) {
        const existingPartners = await xmlRpcCall(objectUrl, 'execute_kw', [
          odooDb, uid, odooApiKey,
          'res.partner', 'search',
          [searchDomain],
          { limit: 1 }
        ]);

        if (existingPartners && existingPartners.length > 0) {
          partnerId = existingPartners[0];
          console.log('Found existing partner:', partnerId);
        }
      }

      // Create new partner if not found
      if (!partnerId) {
        console.log('Creating new partner in Odoo...');
        const partnerData: any = {
          name: profile.name || userEmail || profile.phone || 'Diviso Customer',
          company_id: odooCompanyId,
          customer_rank: 1,
          is_company: false,
        };

        if (userEmail) partnerData.email = userEmail;
        if (profile.phone) partnerData.phone = profile.phone;

        partnerId = await xmlRpcCall(objectUrl, 'execute_kw', [
          odooDb, uid, odooApiKey,
          'res.partner', 'create',
          [partnerData]
        ]);
        console.log('Created new partner:', partnerId);
      }

      // Save partner ID to profile
      await supabase
        .from('profiles')
        .update({ odoo_partner_id: partnerId })
        .eq('id', user_id);
      
      console.log('Saved partner ID to profile');
    } else {
      console.log('Using existing partner ID:', partnerId);
    }

    // Step 2: Get product details from Odoo (need product_product id from template)
    console.log('Fetching product variant ID for template:', productId);
    const productVariants = await xmlRpcCall(objectUrl, 'execute_kw', [
      odooDb, uid, odooApiKey,
      'product.product', 'search_read',
      [[['product_tmpl_id', '=', productId]]],
      { fields: ['id', 'name'], limit: 1 }
    ]);

    if (!productVariants || productVariants.length === 0) {
      throw new Error(`No product variant found for template ID ${productId}`);
    }
    const productVariantId = productVariants[0].id;
    console.log('Product variant ID:', productVariantId);

    // Step 3: Create invoice (account.move)
    console.log('Creating invoice in Odoo...');

    const invoiceLineDescription = description || {
      'subscription_monthly': 'Diviso Monthly Subscription / اشتراك ديفيزو الشهري',
      'subscription_annual': 'Diviso Annual Subscription / اشتراك ديفيزو السنوي',
      'credits_pack': 'Diviso Credits Pack / رصيد ديفيزو',
    }[purchase_type];

    // Build invoice line - only include VAT tax for Saudi users
    const invoiceLine: any = {
      product_id: productVariantId,
      name: invoiceLineDescription,
      quantity: 1,
      price_unit: amountExclVat,
    };

    // Only add VAT tax for Saudi users
    if (isSaudi && vatTaxId) {
      invoiceLine.tax_ids = [[6, 0, [vatTaxId]]];
    } else {
      // Explicitly set no taxes for non-Saudi
      invoiceLine.tax_ids = [[6, 0, []]];
    }

    const invoiceData: any = {
      move_type: 'out_invoice',
      partner_id: partnerId,
      company_id: odooCompanyId,
      journal_id: salesJournalId,
      invoice_date: new Date().toISOString().split('T')[0],
      ref: payment_reference || `DIV-${Date.now()}`,
      invoice_line_ids: [[0, 0, invoiceLine]],
    };

    const invoiceId = await xmlRpcCall(objectUrl, 'execute_kw', [
      odooDb, uid, odooApiKey,
      'account.move', 'create',
      [invoiceData]
    ]);
    console.log('Created invoice ID:', invoiceId);

    // Step 4: Post/validate the invoice to generate sequence number and ZATCA data
    // Skip posting if draft_only flag is set (for testing without hitting live ZATCA)
    // Also skip ZATCA QR generation for non-Saudi (they won't have QR anyway)
    if (!draft_only) {
      console.log('Posting invoice...');
      await xmlRpcCall(objectUrl, 'execute_kw', [
        odooDb, uid, odooApiKey,
        'account.move', 'action_post',
        [[invoiceId]]
      ]);
      console.log('Invoice posted successfully');
    } else {
      console.log('Skipping invoice posting (draft_only mode)');
    }

    // Step 5: Fetch the final invoice data
    console.log('Fetching invoice details...');
    const invoices = await xmlRpcCall(objectUrl, 'execute_kw', [
      odooDb, uid, odooApiKey,
      'account.move', 'search_read',
      [[['id', '=', invoiceId]]],
      { fields: ['id', 'name', 'state', 'amount_total', 'amount_tax', 'amount_untaxed', 'l10n_sa_qr_code_str', 'invoice_date'] }
    ]);

    if (!invoices || invoices.length === 0) {
      throw new Error('Failed to fetch created invoice');
    }

    const invoice = invoices[0];
    console.log('Invoice details:', invoice);

    // Step 6: Update local invoice record if exists
    if (credit_purchase_id || subscription_id) {
      // Only store QR data for Saudi users (non-Saudi won't have ZATCA QR)
      const qrData = isSaudi ? (invoice.l10n_sa_qr_code_str || null) : null;
      
      const updateData: any = {
        qr_payload: qrData,
        qr_base64: qrData,
        // Update VAT fields based on Saudi status
        vat_rate: vatRate,
        total_excl_vat: parseFloat(amountExclVat.toFixed(2)),
        total_vat: parseFloat(vatAmount.toFixed(2)),
        total_incl_vat: parseFloat(amountInclVat.toFixed(2)),
        updated_at: new Date().toISOString(),
      };

      // Find and update the local invoice
      let query = supabase.from('invoices').update(updateData);
      
      if (credit_purchase_id) {
        query = query.eq('credit_purchase_id', credit_purchase_id);
      } else if (subscription_id) {
        query = query.eq('subscription_id', subscription_id);
      }

      const { error: updateError } = await query;
      if (updateError) {
        console.warn('Failed to update local invoice:', updateError);
      } else {
        console.log('Updated local invoice with correct VAT data (isSaudi:', isSaudi, ')');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_saudi: isSaudi,
        vat_applied: isSaudi,
        odoo_invoice: {
          id: invoice.id,
          number: invoice.name,
          state: invoice.state,
          amount_untaxed: invoice.amount_untaxed,
          amount_tax: invoice.amount_tax,
          amount_total: invoice.amount_total,
          invoice_date: invoice.invoice_date,
          qr_code: isSaudi ? invoice.l10n_sa_qr_code_str : null,
        },
        partner_id: partnerId,
        calculation: {
          input_amount: amount,
          amount_excl_vat: parseFloat(amountExclVat.toFixed(2)),
          vat_rate: vatRate,
          vat_amount: parseFloat(vatAmount.toFixed(2)),
          amount_incl_vat: parseFloat(amountInclVat.toFixed(2)),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Odoo invoice:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
