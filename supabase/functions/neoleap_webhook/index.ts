// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function supaService() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, service);
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const rawSig = req.headers.get('x-neoleap-signature');
    const expected = Deno.env.get('NEOLEAP_WEBHOOK_SECRET');
    if (!expected || rawSig !== expected) {
      return new Response('forbidden', { status: 403, headers: corsHeaders });
    }
    const evt = await req.json();
    const type = evt?.type as string;
    const svc = supaService();

    if (type === 'invoice.paid') {
      const user_id = evt?.data?.user_id as string;
      const plan_code = evt?.data?.plan_code as string;
      const period_days = evt?.data?.period_days ?? 30;
      if (user_id && plan_code) {
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + Number(period_days));
        await svc.from('subscriptions').upsert({
          user_id,
          plan_code,
          status: 'active',
          provider: 'neoleap',
          current_period_end: periodEnd.toISOString()
        }, { onConflict: 'user_id' });
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('neoleap_webhook error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

Deno.serve(handler);
