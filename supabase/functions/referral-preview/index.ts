import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch referral code owner
    const { data: codeData, error } = await supabase
      .from('user_referral_codes')
      .select('user_id, referral_code')
      .eq('referral_code', code.toUpperCase())
      .single();

    let inviterName = 'صديقك';

    if (!error && codeData) {
      // Fetch inviter profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, name')
        .eq('id', codeData.user_id)
        .single();

      if (profileData) {
        inviterName = profileData.display_name || profileData.name || 'صديقك';
      }
    }

    const appUrl = 'https://diviso.app';
    const joinUrl = `${appUrl}/join/${code}`;

    // OG content according to spec
    const ogTitle = 'تعال جرّب Diviso معي';
    const ogDescription = 'نستخدمه عشان نقسّم المصاريف بسهولة وبدون مشاكل.\nسجّل من الرابط 👇';
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
  <meta property="og:url" content="${joinUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Diviso">
  <meta property="og:locale" content="ar_SA">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${joinUrl}">
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
      margin-bottom: 12px;
      font-weight: 700;
    }
    .subtitle {
      font-size: 1rem;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .bonus {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      margin-bottom: 32px;
    }
    .bonus strong {
      font-weight: 700;
    }
    .inviter {
      font-size: 1rem;
      opacity: 0.85;
      margin-bottom: 24px;
    }
    .cta-button {
      display: inline-block;
      background: white;
      color: #059669;
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
    <div class="logo">🎁</div>
    <h1>تعال جرّب Diviso معي</h1>
    <p class="subtitle">نستخدمه عشان نقسّم المصاريف بسهولة</p>
    <div class="bonus">🎉 احصل على <strong>7 أيام مجانية</strong></div>
    <p class="inviter">دعوة من ${inviterName}</p>
    <a href="${joinUrl}" class="cta-button">انضم الآن</a>
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
    console.error('Error in referral-preview:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
