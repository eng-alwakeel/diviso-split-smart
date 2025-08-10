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

const INVITE_BASE_URL = Deno.env.get('INVITE_BASE_URL');

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const jwtClient = supaForReq(req);
    const { data: { user } } = await jwtClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { group_id, phone, method } = body as { group_id: string; phone: string; method: 'whatsapp' | 'sms' };
    if (!group_id || !phone || !method) {
      return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate short code
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const link = `${INVITE_BASE_URL ?? 'https://app.diviso.co/i'}/${code}`;

    const svc = supaService();
    const { error: insertErr } = await svc.from('invites').insert({
      group_id,
      inviter_id: user.id,
      phone_or_email: phone,
      invitee_phone: phone,
      method,
      code,
      invite_link: link,
      status: 'pending'
    });
    if (insertErr) throw insertErr;

    // Send via provider (best-effort)
    const tasks: Promise<any>[] = [];
    if (method === 'whatsapp') {
      const token = Deno.env.get('WA_TOKEN');
      const phoneId = Deno.env.get('WA_PHONE_ID');
      const template = Deno.env.get('WA_TEMPLATE_NAME');
      if (token && phoneId && template) {
        tasks.push(fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: { name: template, language: { code: 'ar' }, components: [{ type: 'body', parameters: [{ type: 'text', text: link }] }] }
          })
        }));
      }
    } else if (method === 'sms') {
      const unifonic = Deno.env.get('UNIFONIC_API_KEY');
      if (unifonic) {
        tasks.push(fetch('https://el.cloud.unifonic.com/rest/SMS/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${unifonic}` },
          body: JSON.stringify({ recipient: phone, body: `انضم إلى مجموعتي في ديفيزو: ${link}` })
        }));
      }
    }
    await Promise.allSettled(tasks);

    return new Response(JSON.stringify({ code, link }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('send_invite error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

Deno.serve(handler);
