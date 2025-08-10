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
    const { code, plan_code } = body as { code: string; plan_code?: string };
    const expected = Deno.env.get('ADMIN_UPGRADE_CODE');
    if (!expected || code !== expected) {
      return new Response(JSON.stringify({ error: 'invalid_code' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const plan = plan_code || 'pro_monthly';
    const end = new Date();
    end.setDate(end.getDate() + 30);

    const svc = supaService();
    await svc.from('subscriptions').upsert({
      user_id: user.id,
      plan_code: plan,
      status: 'active',
      provider: 'admin_code',
      current_period_end: end.toISOString()
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('admin_upgrade error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

Deno.serve(handler);
