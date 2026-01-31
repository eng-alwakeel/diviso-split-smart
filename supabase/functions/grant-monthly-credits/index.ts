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

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      foundingProcessed: 0,
      foundingSuccess: 0,
      errors: [] as string[]
    };

    // ==========================================
    // PART 1: Process Subscription Users
    // ==========================================
    
    // Find active subscriptions that need monthly credit renewal
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
    } else {
      console.log(`Found ${subscriptions?.length || 0} subscriptions to process`);

      for (const sub of subscriptions || []) {
        try {
          if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
            console.log(`Subscription ${sub.id} has expired, skipping`);
            continue;
          }

          const planNameMap: Record<string, string> = {
            'personal': 'Pro',
            'family': 'Max',
            'lifetime': 'Lifetime'
          };
          const planName = planNameMap[sub.plan] || 'Pro';

          console.log(`Granting credits for user ${sub.user_id}, plan: ${planName}`);

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

            const nextRenewal = new Date();
            nextRenewal.setMonth(nextRenewal.getMonth() + 1);

            await supabase
              .from('user_subscriptions')
              .update({
                next_renewal_date: nextRenewal.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);

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
    }

    // ==========================================
    // PART 2: Process Founding Users
    // ==========================================
    
    console.log('=== Processing Founding Users ===');
    
    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Get founding users who were active in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: foundingUsers, error: foundingError } = await supabase
      .from('profiles')
      .select('id, user_number, last_active_at')
      .eq('is_founding_user', true)
      .gte('last_active_at', thirtyDaysAgo);

    if (foundingError) {
      console.error('Error fetching founding users:', foundingError);
      results.errors.push(`Founding users fetch: ${foundingError.message}`);
    } else {
      console.log(`Found ${foundingUsers?.length || 0} active founding users`);

      for (const user of foundingUsers || []) {
        try {
          results.foundingProcessed++;
          
          // Check if already granted this month
          const { data: existingGrant } = await supabase
            .from('usage_credits')
            .select('id')
            .eq('user_id', user.id)
            .eq('source', 'founding_monthly')
            .gte('created_at', startOfMonth)
            .maybeSingle();

          if (existingGrant) {
            console.log(`User ${user.id} already received founding credits this month, skipping`);
            continue;
          }

          // Grant 50 monthly credits
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          
          const { error: insertError } = await supabase
            .from('usage_credits')
            .insert({
              user_id: user.id,
              amount: 50,
              source: 'founding_monthly',
              description_ar: 'نقاط شهرية - مستخدم مؤسس',
              expires_at: expiresAt
            });

          if (insertError) {
            console.error(`Error granting founding credits to user ${user.id}:`, insertError);
            results.errors.push(`Founding ${user.id}: ${insertError.message}`);
          } else {
            console.log(`Successfully granted 50 founding credits to user ${user.id} (user #${user.user_number})`);
            results.foundingSuccess++;

            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'credits',
                title_ar: 'نقاط شهرية للمؤسسين! ⭐',
                message_ar: 'تم إضافة 50 نقطة إلى رصيدك كمستخدم مؤسس. شكراً لدعمك المستمر!'
              });
          }
        } catch (err) {
          console.error(`Error processing founding user ${user.id}:`, err);
          results.errors.push(`Founding ${user.id}: ${err.message}`);
        }
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
