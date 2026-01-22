import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  console.log('XML-RPC Response status:', response.status);
  
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
  // Check for fault
  const faultMatch = xml.match(/<fault>([\s\S]*?)<\/fault>/);
  if (faultMatch) {
    const faultString = xml.match(/<name>faultString<\/name>\s*<value>(?:<string>)?([\s\S]*?)(?:<\/string>)?<\/value>/);
    throw new Error(`XML-RPC Fault: ${faultString?.[1] || 'Unknown error'}`);
  }

  // Extract value from params
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
  
  // Integer
  const intMatch = xml.match(/^<(?:int|i4)>([-\d]+)<\/(?:int|i4)>$/);
  if (intMatch) return parseInt(intMatch[1], 10);

  // Double
  const doubleMatch = xml.match(/^<double>([-\d.]+)<\/double>$/);
  if (doubleMatch) return parseFloat(doubleMatch[1]);

  // Boolean
  const boolMatch = xml.match(/^<boolean>([01])<\/boolean>$/);
  if (boolMatch) return boolMatch[1] === '1';

  // String
  const stringMatch = xml.match(/^<string>([\s\S]*?)<\/string>$/);
  if (stringMatch) return stringMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // Plain text (no type tag)
  if (!xml.startsWith('<')) return xml;

  // Array - use balanced tag extraction
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

  // Struct - use balanced tag extraction
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

serve(async (req) => {
  console.log('=== Test Odoo Connection ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');
    const odooCompanyId = Deno.env.get('ODOO_COMPANY_ID');
    const productMonthlyId = Deno.env.get('ODOO_PRODUCT_MONTHLY_SUB_ID');
    const productAnnualId = Deno.env.get('ODOO_PRODUCT_ANNUAL_SUB_ID');
    const productCreditsId = Deno.env.get('ODOO_PRODUCT_CREDITS_ID');
    const salesJournalId = Deno.env.get('ODOO_SALES_JOURNAL_ID');

    const results: any = {
      connection: { status: 'pending', message: '' },
      authentication: { status: 'pending', message: '', uid: null },
      company: { status: 'pending', message: '', data: null },
      products: { status: 'pending', message: '', data: [] },
      journal: { status: 'pending', message: '', data: null },
    };

    // Check required env vars
    const missingVars = [];
    if (!odooUrl) missingVars.push('ODOO_URL');
    if (!odooDb) missingVars.push('ODOO_DB');
    if (!odooUsername) missingVars.push('ODOO_USERNAME');
    if (!odooApiKey) missingVars.push('ODOO_API_KEY');
    if (!odooCompanyId) missingVars.push('ODOO_COMPANY_ID');

    if (missingVars.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing environment variables: ${missingVars.join(', ')}`,
          results 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Test connection (common endpoint)
    console.log('Step 1: Testing connection to', odooUrl);
    try {
      const commonUrl = `${odooUrl}/xmlrpc/2/common`;
      const version = await xmlRpcCall(commonUrl, 'version', []);
      results.connection = { 
        status: 'success', 
        message: `Connected to Odoo ${version?.server_version || 'unknown'}`,
        data: version
      };
      console.log('Connection successful:', version);
    } catch (error) {
      results.connection = { status: 'error', message: error.message };
      throw new Error(`Connection failed: ${error.message}`);
    }

    // Step 2: Authenticate
    console.log('Step 2: Authenticating user', odooUsername);
    let uid: number;
    try {
      const commonUrl = `${odooUrl}/xmlrpc/2/common`;
      uid = await xmlRpcCall(commonUrl, 'authenticate', [odooDb, odooUsername, odooApiKey, {}]);
      
      if (!uid || uid === false) {
        throw new Error('Authentication failed - invalid credentials or API key');
      }
      
      results.authentication = { 
        status: 'success', 
        message: `Authenticated as user ID: ${uid}`,
        uid 
      };
      console.log('Authentication successful, UID:', uid);
    } catch (error) {
      results.authentication = { status: 'error', message: error.message };
      throw new Error(`Authentication failed: ${error.message}`);
    }

    const objectUrl = `${odooUrl}/xmlrpc/2/object`;

    // Step 3: Verify company
    console.log('Step 3: Verifying company', odooCompanyId);
    try {
      const companies = await xmlRpcCall(objectUrl, 'execute_kw', [
        odooDb, uid, odooApiKey,
        'res.company', 'search_read',
        [[['id', '=', parseInt(odooCompanyId!)]]],
        { fields: ['id', 'name', 'vat', 'street', 'city', 'country_id'] }
      ]);

      if (!companies || companies.length === 0) {
        throw new Error(`Company ID ${odooCompanyId} not found`);
      }

      results.company = {
        status: 'success',
        message: `Found company: ${companies[0].name}`,
        data: companies[0]
      };
      console.log('Company found:', companies[0]);
    } catch (error) {
      results.company = { status: 'error', message: error.message };
    }

    // Step 4: Verify products
    console.log('Step 4: Verifying products');
    try {
      const productIds = [
        { id: productMonthlyId, name: 'Monthly Subscription' },
        { id: productAnnualId, name: 'Annual Subscription' },
        { id: productCreditsId, name: 'Credits Pack' },
      ].filter(p => p.id);

      const productsData = [];
      for (const product of productIds) {
        const products = await xmlRpcCall(objectUrl, 'execute_kw', [
          odooDb, uid, odooApiKey,
          'product.product', 'search_read',
          [[['id', '=', parseInt(product.id!)]]],
          { fields: ['id', 'name', 'list_price', 'default_code'] }
        ]);

        if (products && products.length > 0) {
          productsData.push({ expected: product.name, found: products[0] });
        } else {
          productsData.push({ expected: product.name, error: `Product ID ${product.id} not found` });
        }
      }

      const allFound = productsData.every(p => p.found);
      results.products = {
        status: allFound ? 'success' : 'warning',
        message: allFound ? 'All products found' : 'Some products missing',
        data: productsData
      };
      console.log('Products check:', productsData);
    } catch (error) {
      results.products = { status: 'error', message: error.message };
    }

    // Step 5: Verify sales journal
    console.log('Step 5: Verifying sales journal', salesJournalId);
    if (salesJournalId) {
      try {
        const journals = await xmlRpcCall(objectUrl, 'execute_kw', [
          odooDb, uid, odooApiKey,
          'account.journal', 'search_read',
          [[['id', '=', parseInt(salesJournalId)]]],
          { fields: ['id', 'name', 'type', 'code'] }
        ]);

        if (!journals || journals.length === 0) {
          throw new Error(`Journal ID ${salesJournalId} not found`);
        }

        if (journals[0].type !== 'sale') {
          throw new Error(`Journal ${journals[0].name} is not a sales journal (type: ${journals[0].type})`);
        }

        results.journal = {
          status: 'success',
          message: `Found sales journal: ${journals[0].name}`,
          data: journals[0]
        };
        console.log('Journal found:', journals[0]);
      } catch (error) {
        results.journal = { status: 'error', message: error.message };
      }
    } else {
      results.journal = { status: 'warning', message: 'No sales journal ID configured' };
    }

    // Summary
    const allSuccess = Object.values(results).every((r: any) => r.status === 'success');
    const hasErrors = Object.values(results).some((r: any) => r.status === 'error');

    return new Response(
      JSON.stringify({ 
        success: allSuccess,
        hasErrors,
        message: allSuccess ? 'All Odoo configurations are valid!' : 'Some issues found',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error testing Odoo connection:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
