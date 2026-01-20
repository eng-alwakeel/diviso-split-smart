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
    const { currentPassword } = await req.json();
    
    if (!currentPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Session expired or invalid' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Verifying password for user:', user.id, 'email:', user.email);

    // Create a new client instance for password verification
    const verificationClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    // Determine sign-in method based on user's auth identity (email or phone)
    let signInError;
    
    if (user.email) {
      // User has email - verify with email
      const result = await verificationClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      signInError = result.error;
    } else if (user.phone) {
      // User has phone only - verify with phone
      const result = await verificationClient.auth.signInWithPassword({
        phone: user.phone,
        password: currentPassword
      });
      signInError = result.error;
    } else {
      return new Response(
        JSON.stringify({ error: 'User has no email or phone configured' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Immediately sign out to not create any session artifacts
    await verificationClient.auth.signOut();

    if (signInError) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid current password' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ valid: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Password verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})