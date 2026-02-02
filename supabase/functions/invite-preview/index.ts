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

    const groupName = groupData?.name || 'مجموعة جديدة';
    const senderName = creatorData?.display_name || creatorData?.name || 'صديقك';
    const appUrl = 'https://diviso.app';
    const inviteUrl = `${appUrl}/i/${token}`;

    // للمستخدمين العاديين: redirect مباشر للتطبيق
    if (!isCrawler(userAgent)) {
      console.log(`User redirect to: ${inviteUrl}`);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': inviteUrl,
        },
      });
    }

    // للـ crawlers: أرسل HTML مع OG tags
    console.log(`Crawler detected: ${userAgent.substring(0, 50)}...`);

    // OG content according to spec
    const ogTitle = `${senderName} يدعوك للانضمام لمجموعة "${groupName}"`;
    const ogDescription = `قسّموا مصاريف "${groupName}" بينكم بوضوح وبدون إحراج.\nانضم الآن 👇`;
    const ogImage = `${appUrl}/og-image.png`;

    // Always return HTML for both crawlers and users
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${ogTitle} | Diviso</title>
  <meta name="title" content="${ogTitle}">
  <meta name="description" content="${ogDescription}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${inviteUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Diviso">
  <meta property="og:locale" content="ar_SA">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${inviteUrl}">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
      width: 100%;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .group-name {
      font-size: 1.25rem;
      opacity: 0.95;
      margin-bottom: 16px;
    }
    .sender {
      font-size: 1rem;
      opacity: 0.85;
      margin-bottom: 32px;
    }
    .cta-button {
      display: inline-block;
      background: white;
      color: #667eea;
      font-size: 1.125rem;
      font-weight: 700;
      padding: 16px 48px;
      border-radius: 12px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    }
    .footer {
      margin-top: 32px;
      font-size: 0.875rem;
      opacity: 0.7;
    }
    .diviso-logo {
      font-weight: 700;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📊</div>
    <h1>دعوة للانضمام</h1>
    <p class="group-name">"${groupName}"</p>
    <p class="sender">من ${senderName}</p>
    <a href="${inviteUrl}" class="cta-button">انضم للمجموعة</a>
    <div class="footer">
      <span class="diviso-logo">Diviso</span> — قسّم المصاريف بذكاء
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });

  } catch (error) {
    console.error('Error in invite-preview:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
