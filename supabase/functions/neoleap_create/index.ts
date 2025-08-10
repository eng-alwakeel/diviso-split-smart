// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function supaForReq(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(supabaseUrl, anon, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
}

function supaService() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, service);
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const jwtClient = supaForReq(req);
    const { data: { user } } = await jwtClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { plan_code } = body as { plan_code: string };
    if (!plan_code) return new Response(JSON.stringify({ error: 'missing_plan_code' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const svc = supaService();
    const { data: plan, error: planErr } = await svc.from('plans').select('code, period').eq('code', plan_code).maybeSingle();
    if (planErr || !plan) return new Response(JSON.stringify({ error: 'invalid_plan' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Require Neoleap secrets
    const pub = Deno.env.get('NEOLEAP_PUBLIC_KEY');
    const sec = Deno.env.get('NEOLEAP_SECRET_KEY');
    if (!pub || !sec) {
      return new Response(JSON.stringify({ error: 'missing_neoleap_keys' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // TODO: Integrate Neoleap sandbox create-session here
    // For now, return a placeholder URL so flow can continue visually
    const checkout_url = `https://neoleap.example/sandbox/checkout?plan=${encodeURIComponent(plan_code)}`;

    return new Response(JSON.stringify({ checkout_url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('neoleap_create error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

Deno.serve(handler);
