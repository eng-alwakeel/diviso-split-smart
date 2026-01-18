import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common crawler User-Agents
const crawlerPatterns = [
  'whatsapp',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'telegrambot',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'applebot',
  'facebot',
  'pinterest',
  'snapchat',
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return crawlerPatterns.some(pattern => ua.includes(pattern));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const userAgent = req.headers.get('user-agent') || '';

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch token data with group and creator info
    const { data: tokenData, error } = await supabase
      .from('group_join_tokens')
      .select(`
        token,
        group_id,
        created_by,
        expires_at
      `)
      .eq('token', token)
      .single();

    if (error || !tokenData) {
      console.error('Token not found:', error);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch group details
    const { data: groupData } = await supabase
      .from('groups')
      .select('name')
      .eq('id', tokenData.group_id)
      .single();

    // Fetch creator profile
    const { data: creatorData } = await supabase
      .from('profiles')
      .select('display_name, name')
      .eq('id', tokenData.created_by)
      .single();

    const groupName = groupData?.name || 'المجموعة';
    const senderName = creatorData?.display_name || creatorData?.name || 'صديقك';
    const appUrl = 'https://diviso-split-smart.lovable.app';
    const inviteUrl = `${appUrl}/i/${token}`;

    // Check if request is from a crawler
    if (isCrawler(userAgent)) {
      // Return HTML with dynamic Open Graph tags
      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>دعوة من ${senderName} للانضمام لـ ${groupName} | Diviso</title>
  <meta name="title" content="دعوة من ${senderName} للانضمام لـ ${groupName}">
  <meta name="description" content="${senderName} يدعوك للانضمام لمجموعة &quot;${groupName}&quot; على ديفيسو لتقسيم المصاريف بسهولة">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${inviteUrl}">
  <meta property="og:title" content="دعوة من ${senderName} للانضمام لـ ${groupName}">
  <meta property="og:description" content="${senderName} يدعوك للانضمام لمجموعة &quot;${groupName}&quot; على ديفيسو لتقسيم المصاريف بسهولة">
  <meta property="og:image" content="${appUrl}/og-image.png">
  <meta property="og:site_name" content="Diviso | ديفيسو">
  <meta property="og:locale" content="ar_SA">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${inviteUrl}">
  <meta name="twitter:title" content="دعوة من ${senderName} للانضمام لـ ${groupName}">
  <meta name="twitter:description" content="${senderName} يدعوك للانضمام لمجموعة &quot;${groupName}&quot; على ديفيسو">
  <meta name="twitter:image" content="${appUrl}/og-image.png">
  
  <!-- Redirect to actual invite page -->
  <meta http-equiv="refresh" content="0;url=${inviteUrl}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .container {
      padding: 2rem;
    }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>دعوة من ${senderName}</h1>
    <p>جاري التحويل إلى مجموعة "${groupName}"...</p>
  </div>
</body>
</html>`;

      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });
    }

    // For non-crawlers, return JSON with invite data
    return new Response(JSON.stringify({
      success: true,
      data: {
        groupName,
        senderName,
        inviteUrl,
        token,
        expiresAt: tokenData.expires_at,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in invite-preview:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
