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
  
  // CTA button text based on path
  const ctaText = path === '/launch' ? 'جرّب الآن' : 'جرّب Diviso';

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
  
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
      color: white;
      text-align: center;
      padding: 2rem;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    p {
      font-size: 1.1rem;
      opacity: 0.95;
      margin-bottom: 2rem;
      max-width: 320px;
      line-height: 1.6;
    }
    .cta-btn {
      display: inline-block;
      background: white;
      color: #65a30d;
      font-size: 1.2rem;
      font-weight: 700;
      padding: 1rem 2.5rem;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.2);
    }
    .footer {
      margin-top: 3rem;
      font-size: 0.875rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <img src="${appUrl}/logo.svg" alt="Diviso" class="logo" onerror="this.style.display='none'">
  <h1>${metadata.title}</h1>
  <p>${metadata.description}</p>
  <a href="${fullUrl}" class="cta-btn">${ctaText}</a>
  <div class="footer">Diviso - قسّم بذكاء</div>
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
