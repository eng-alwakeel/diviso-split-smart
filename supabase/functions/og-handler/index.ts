const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Crawler User-Agent patterns
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

// Page metadata map
const pageMetadata: Record<string, { title: string; description: string }> = {
  '/from': {
    title: 'استخدمت تطبيق بسيط للقسمة بين الأصدقاء',
    description: 'خصوصًا في الشعبنة، ريحنا من اللخبطة. اللي حاب يجرّبه 👇',
  },
  '/launch': {
    title: 'القسمة دايمًا تلخبط؟ خلّها واضحة',
    description: 'تطبيق بسيط يخلي القسمة بين الأصدقاء عادلة بدون إحراج ولا نقاش',
  },
};

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return crawlerPatterns.some(pattern => ua.includes(pattern));
}

function generateOgHtml(path: string, fullUrl: string): string {
  const metadata = pageMetadata[path] || {
    title: 'Diviso | قسّم بذكاء، سافر براحة',
    description: 'قسّم المصاريف بين الأصدقاء والعائلة بسهولة',
  };

  const appUrl = 'https://diviso.app';
  const ogImage = `${appUrl}/og-image.png`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${metadata.title} | Diviso</title>
  <meta name="title" content="${metadata.title}">
  <meta name="description" content="${metadata.description}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="${metadata.title}">
  <meta property="og:description" content="${metadata.description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:site_name" content="Diviso">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullUrl}">
  <meta name="twitter:title" content="${metadata.title}">
  <meta name="twitter:description" content="${metadata.description}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${fullUrl}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
      color: white;
      text-align: center;
    }
    .container { padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${metadata.title}</h1>
    <p>جاري التحويل...</p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/from';
    const utmSource = url.searchParams.get('utm_source') || '';
    const userAgent = req.headers.get('user-agent') || '';

    // Build the full redirect URL
    const appUrl = 'https://diviso.app';
    let fullUrl = `${appUrl}${path}`;
    
    // Preserve UTM parameters
    const utmParams = [];
    if (utmSource) utmParams.push(`utm_source=${encodeURIComponent(utmSource)}`);
    url.searchParams.forEach((value, key) => {
      if (key.startsWith('utm_') && key !== 'utm_source') {
        utmParams.push(`${key}=${encodeURIComponent(value)}`);
      }
    });
    if (utmParams.length > 0) {
      fullUrl += `?${utmParams.join('&')}`;
    }

    // Check if request is from a crawler
    if (isCrawler(userAgent)) {
      console.log(`Crawler detected: ${userAgent.substring(0, 50)}... for path: ${path}`);
      
      const html = generateOgHtml(path, fullUrl);
      
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // For regular users, redirect to the app
    console.log(`Regular user redirect to: ${fullUrl}`);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': fullUrl,
      },
    });

  } catch (error) {
    console.error('Error in og-handler:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
