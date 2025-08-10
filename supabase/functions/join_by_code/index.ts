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
    const { code } = body as { code: string };
    if (!code) return new Response(JSON.stringify({ error: 'missing_code' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const svc = supaService();
    const { data: invite, error } = await svc.from('invites').select('id, group_id, status').eq('code', code).maybeSingle();
    if (error || !invite) return new Response(JSON.stringify({ error: 'invalid_code' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (invite.status !== 'pending') return new Response(JSON.stringify({ error: 'already_used' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Add member
    await svc.from('group_members').insert({ group_id: invite.group_id, user_id: user.id, role: 'member' });
    await svc.from('invites').update({ accepted_at: new Date().toISOString(), status: 'accepted' }).eq('id', invite.id);

    return new Response(JSON.stringify({ ok: true, group_id: invite.group_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('join_by_code error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

Deno.serve(handler);
