import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = 'diviso-indexnow-2026';
const SITE_URL = 'https://diviso.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls)) {
      return new Response(JSON.stringify({ error: 'Invalid urls array' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Send to IndexNow API (supports Bing, DuckDuckGo, Yandex)
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'diviso.app',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/indexnow-key.txt`,
        urlList: urls.map((url: string) => url.startsWith('http') ? url : `${SITE_URL}${url}`)
      })
    });

    console.log(`IndexNow submitted ${urls.length} URLs, status: ${response.status}`);

    return new Response(JSON.stringify({ 
      success: response.ok,
      status: response.status,
      urlsSubmitted: urls.length,
      message: response.ok ? 'URLs submitted successfully' : 'Submission failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('IndexNow error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
