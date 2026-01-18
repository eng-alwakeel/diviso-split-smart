import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// MD5 hash function using Web Crypto API
async function md5(message: string): Promise<string> {
  // Deno doesn't have native MD5, so we use a simple implementation
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Use SubtleCrypto for hashing (MD5 is not supported, but we can use a polyfill approach)
  // For Paymentwall, we'll implement a simple MD5
  const md5Hash = await computeMD5(data);
  return md5Hash;
}

// Simple MD5 implementation for Deno
function computeMD5(data: Uint8Array): string {
  const safeAdd = (x: number, y: number): number => {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  };

  const bitRotateLeft = (num: number, cnt: number): number => {
    return (num << cnt) | (num >>> (32 - cnt));
  };

  const md5cmn = (q: number, a: number, b: number, x: number, s: number, t: number): number => {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  };

  const md5ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  };

  const md5gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  };

  const md5hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  };

  const md5ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  };

  const bytesToWords = (bytes: Uint8Array): number[] => {
    const words: number[] = [];
    for (let i = 0, j = 0; i < bytes.length; i++, j += 8) {
      words[j >>> 5] |= bytes[i] << (j % 32);
    }
    return words;
  };

  const wordsToHex = (words: number[]): string => {
    const hexChars = '0123456789abcdef';
    let hex = '';
    for (let i = 0; i < words.length * 4; i++) {
      hex += hexChars[(words[i >>> 2] >>> ((i % 4) * 8 + 4)) & 0x0f];
      hex += hexChars[(words[i >>> 2] >>> ((i % 4) * 8)) & 0x0f];
    }
    return hex;
  };

  const len = data.length;
  const paddedLen = ((len + 8) >>> 6) + 1;
  const paddedData = new Uint8Array(paddedLen * 64);
  paddedData.set(data);
  paddedData[len] = 0x80;
  
  const bitLen = len * 8;
  const view = new DataView(paddedData.buffer);
  view.setUint32((paddedLen * 64) - 8, bitLen & 0xffffffff, true);
  view.setUint32((paddedLen * 64) - 4, Math.floor(bitLen / 0x100000000), true);

  const x = bytesToWords(paddedData);

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;

    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return wordsToHex([a, b, c, d]);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    
    // 1. Extract parameters from Paymentwall
    const uid = params.uid;           // user_id
    const ref = params.ref;           // transaction ID (unique)
    const sig = params.sig;           // signature
    const type = params.type;         // 0 = offer completion
    
    console.log(`Paymentwall pingback received: uid=${uid}, ref=${ref}, type=${type}`);

    // 2. Validate required parameters
    if (!uid || !ref || !sig) {
      console.error('Missing required parameters');
      return new Response('OK', { 
        status: 200,
        headers: corsHeaders 
      });
    }

    // 3. Verify signature
    const secretKey = Deno.env.get('PAYMENTWALL_SECRET_KEY');
    if (!secretKey) {
      console.error('PAYMENTWALL_SECRET_KEY not configured');
      return new Response('OK', { 
        status: 200,
        headers: corsHeaders 
      });
    }

    // Paymentwall signature verification: MD5(sorted_params + secret_key)
    const { sig: _, ...paramsWithoutSig } = params;
    const sortedParams = Object.keys(paramsWithoutSig)
      .sort()
      .map(k => `${k}=${paramsWithoutSig[k]}`)
      .join('');
    const expectedSig = await md5(sortedParams + secretKey);
    
    if (sig !== expectedSig) {
      console.error(`Invalid signature. Expected: ${expectedSig}, Got: ${sig}`);
      return new Response('OK', { 
        status: 200,
        headers: corsHeaders 
      });
    }

    console.log('Signature verified successfully');

    // 4. Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Validate user_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uid)) {
      console.error('Invalid user_id format');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // 6. Check for duplicate ref (prevent double rewards)
    const { data: existing } = await supabase
      .from('one_time_action_tokens')
      .select('id')
      .eq('source_session_id', ref)
      .eq('source', 'paymentwall')
      .maybeSingle();

    if (existing) {
      console.log(`Duplicate pingback for ref=${ref}, skipping`);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // 7. Check daily limit (5 tokens per user per day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('one_time_action_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('source', 'paymentwall')
      .gte('created_at', startOfDay.toISOString());

    if (countError) {
      console.error('Error checking daily limit:', countError);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    if ((count || 0) >= 5) {
      console.log(`User ${uid} reached daily limit (5/day). Current count: ${count}`);
      // Return OK so Paymentwall doesn't retry
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // 8. Create new token
    // expires_at = 24 hours from now (token expires if not used)
    // The 30-second activation window starts when user first uses the token
    const { error: insertError } = await supabase
      .from('one_time_action_tokens')
      .insert({
        user_id: uid,
        source: 'paymentwall',
        source_session_id: ref,
        action_type: 'any',
        is_used: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    if (insertError) {
      console.error('Error creating token:', insertError);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    console.log(`Token created for user ${uid}, ref=${ref}, daily count: ${(count || 0) + 1}/5`);
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Paymentwall pingback error:', error);
    // Always return OK to prevent Paymentwall from retrying
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
