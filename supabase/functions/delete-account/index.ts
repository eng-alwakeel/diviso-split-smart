import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from token using regular client
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Deleting account for user:', user.id);

    // Clean up user data in the correct order (due to foreign key constraints)
    
    // 1. Delete user-owned records first
    await supabaseAdmin.from('notifications').delete().eq('user_id', user.id);
    await supabaseAdmin.from('user_settings').delete().eq('user_id', user.id);
    await supabaseAdmin.from('user_subscriptions').delete().eq('user_id', user.id);
    await supabaseAdmin.from('user_referral_codes').delete().eq('user_id', user.id);
    await supabaseAdmin.from('referrals').delete().eq('inviter_id', user.id);
    await supabaseAdmin.from('referral_rewards').delete().eq('user_id', user.id);
    await supabaseAdmin.from('receipt_ocr').delete().eq('created_by', user.id);

    // 2. Leave groups (but don't delete if user is owner - that would break data integrity)
    const { data: ownedGroups } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('owner_id', user.id);

    if (ownedGroups && ownedGroups.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot delete account while owning groups. Please transfer ownership or delete groups first.',
          owned_groups: ownedGroups.length
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remove from groups as member
    await supabaseAdmin.from('group_members').delete().eq('user_id', user.id);

    // 3. Delete the user profile
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);

    // 4. Finally delete the user from auth (this cascades)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Failed to delete user from auth:', deleteError);
      throw deleteError;
    }

    console.log('Account successfully deleted for user:', user.id);

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Account deletion error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete account', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})