import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Moyasar Webhook Called ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const moyasarSecretKey = Deno.env.get('MOYASAR_SECRET_KEY');
    const webhookSecret = Deno.env.get('MOYASAR_WEBHOOK_SECRET');

    // Verify webhook secret token (Moyasar sends it in X-Secret-Token header)
    const providedToken = req.headers.get('X-Secret-Token') || 
                          req.headers.get('X-Webhook-Secret') || 
                          req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (webhookSecret && providedToken !== webhookSecret) {
      console.error('Invalid webhook secret token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!moyasarSecretKey) {
      console.error('MOYASAR_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Moyasar webhook received, payment status:', body?.status);

    const { id: paymentId, status, metadata } = body;
    
    if (!paymentId) {
      console.error('No payment ID in webhook');
      return new Response(
        JSON.stringify({ error: 'Missing payment ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Moyasar API
    const verifyResponse = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`,
      },
    });

    if (!verifyResponse.ok) {
      console.error('Failed to verify payment with Moyasar:', verifyResponse.status);
      return new Response(
        JSON.stringify({ error: 'Payment verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentData = await verifyResponse.json();
    console.log('Moyasar payment verified, status:', paymentData.status);

    // Check if payment is successful
    if (paymentData.status !== 'paid') {
      console.log('Payment not successful, status:', paymentData.status);
      return new Response(
        JSON.stringify({ message: 'Payment not successful', status: paymentData.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get purchase_id and type from metadata
    const purchaseId = paymentData.metadata?.purchase_id || metadata?.purchase_id;
    const purchaseType = paymentData.metadata?.type || metadata?.type || 'credits';
    
    if (!purchaseId) {
      console.error('No purchase_id in payment metadata');
      return new Response(
        JSON.stringify({ error: 'Missing purchase_id in metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;
    let rpcError;

    if (purchaseType === 'subscription') {
      // Handle subscription purchase
      console.log('Processing subscription purchase:', purchaseId);
      
      const response = await supabase.rpc('complete_subscription_purchase', {
        p_purchase_id: purchaseId,
        p_payment_reference: paymentId
      });
      
      result = response.data;
      rpcError = response.error;
    } else {
      // Handle credit purchase (existing logic)
      console.log('Processing credit purchase:', purchaseId);
      
      const response = await supabase.rpc('complete_credit_purchase', {
        p_purchase_id: purchaseId,
        p_payment_reference: paymentId
      });
      
      result = response.data;
      rpcError = response.error;
    }

    if (rpcError) {
      console.error('Error completing purchase:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete purchase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result || result.success === false) {
      console.log('Purchase already completed or not found:', purchaseId);
      return new Response(
        JSON.stringify({ message: 'Purchase already processed or not found', result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Purchase completed successfully, type:', purchaseType);

    return new Response(
      JSON.stringify({ success: true, purchase_id: purchaseId, type: purchaseType, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});