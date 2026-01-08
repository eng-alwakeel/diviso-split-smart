import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Grant Monthly Credits Function Called ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find active subscriptions that need monthly credit renewal
    // last_credits_granted_at should be more than 30 days ago (or NULL for first time)
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan,
        billing_cycle,
        status,
        last_credits_granted_at,
        next_renewal_date,
        expires_at
      `)
      .eq('status', 'active')
      .or('last_credits_granted_at.is.null,last_credits_granted_at.lt.' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions to process`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const sub of subscriptions || []) {
      try {
        // Check if subscription is still valid
        if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
          console.log(`Subscription ${sub.id} has expired, skipping`);
          continue;
        }

        // Map plan to plan name for credit granting
        const planNameMap: Record<string, string> = {
          'personal': 'Pro',
          'family': 'Max',
          'lifetime': 'Lifetime'
        };
        const planName = planNameMap[sub.plan] || 'Pro';

        console.log(`Granting credits for user ${sub.user_id}, plan: ${planName}`);

        // Grant subscription credits
        const { data: grantResult, error: grantError } = await supabase.rpc('grant_subscription_credits', {
          p_user_id: sub.user_id,
          p_plan_name: planName
        });

        if (grantError) {
          console.error(`Error granting credits for user ${sub.user_id}:`, grantError);
          results.failed++;
          results.errors.push(`User ${sub.user_id}: ${grantError.message}`);
          continue;
        }

        if (grantResult?.success) {
          console.log(`Successfully granted ${grantResult.credits_granted} credits to user ${sub.user_id}`);
          results.success++;

          // Update next_renewal_date
          const nextRenewal = new Date();
          nextRenewal.setMonth(nextRenewal.getMonth() + 1);

          await supabase
            .from('user_subscriptions')
            .update({
              next_renewal_date: nextRenewal.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', sub.id);

          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: sub.user_id,
              type: 'subscription',
              title_ar: 'تم تجديد نقاطك الشهرية!',
              message_ar: `تم إضافة ${grantResult.credits_granted} نقطة إلى رصيدك كجزء من اشتراكك.`
            });
        } else {
          console.error(`Grant credits returned unsuccessful for user ${sub.user_id}:`, grantResult);
          results.failed++;
          results.errors.push(`User ${sub.user_id}: ${grantResult?.error || 'Unknown error'}`);
        }

        results.processed++;
      } catch (err) {
        console.error(`Error processing subscription ${sub.id}:`, err);
        results.failed++;
        results.errors.push(`Subscription ${sub.id}: ${err.message}`);
      }
    }

    console.log('Monthly credits grant completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly credits grant completed',
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in grant-monthly-credits:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
