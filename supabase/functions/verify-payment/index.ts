import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('verify-payment called, method:', req.method);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const moyasarSecretKey = Deno.env.get('MOYASAR_SECRET_KEY');

    if (!moyasarSecretKey) {
      console.error('MOYASAR_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { purchaseId, paymentId } = await req.json();
    console.log('Verifying payment:', { purchaseId, paymentId });

    if (!purchaseId) {
      return new Response(
        JSON.stringify({ error: 'Missing purchaseId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First check if purchase is already completed
    const { data: purchase, error: purchaseError } = await supabase
      .from('credit_purchases')
      .select('status, payment_reference')
      .eq('id', purchaseId)
      .single();

    if (purchaseError) {
      console.error('Error fetching purchase:', purchaseError);
      return new Response(
        JSON.stringify({ error: 'Purchase not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already completed, return success
    if (purchase.status === 'completed') {
      console.log('Purchase already completed:', purchaseId);
      return new Response(
        JSON.stringify({ success: true, status: 'completed', alreadyProcessed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we have a payment ID, verify with Moyasar
    if (paymentId) {
      console.log('Verifying payment with Moyasar:', paymentId);
      
      const verifyResponse = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`,
        },
      });

      if (!verifyResponse.ok) {
        console.error('Failed to verify payment with Moyasar:', verifyResponse.status);
        return new Response(
          JSON.stringify({ error: 'Payment verification failed', status: 'failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentData = await verifyResponse.json();
      console.log('Moyasar payment status:', paymentData.status);

      // Check if payment is successful
      if (paymentData.status === 'paid') {
        // Complete the purchase
        const { data: result, error: rpcError } = await supabase.rpc('complete_credit_purchase', {
          p_purchase_id: purchaseId,
          p_payment_reference: paymentId
        });

        if (rpcError) {
          console.error('Error completing purchase:', rpcError);
          return new Response(
            JSON.stringify({ error: 'Failed to complete purchase', details: rpcError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Purchase completed successfully via verify-payment:', purchaseId);
        return new Response(
          JSON.stringify({ success: true, status: 'completed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (paymentData.status === 'failed') {
        // Mark as failed
        await supabase
          .from('credit_purchases')
          .update({ status: 'failed' })
          .eq('id', purchaseId);

        return new Response(
          JSON.stringify({ success: false, status: 'failed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Still pending
        return new Response(
          JSON.stringify({ success: false, status: paymentData.status }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No payment ID, return current status
    return new Response(
      JSON.stringify({ success: false, status: purchase.status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
