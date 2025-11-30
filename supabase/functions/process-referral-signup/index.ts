import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralSignupRequest {
  userId: string;
  referralCode: string;
  userPhone: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Process Referral Signup Function Started ===");
    
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { userId, referralCode, userEmail, userName, userPhone }: ReferralSignupRequest = await req.json();
    
    // Logging sanitized for security - no PII in production logs
    const isDev = Deno.env.get('ENVIRONMENT') === 'development';
    if (isDev) {
      console.log('Processing referral signup for user with code:', referralCode);
    }

    if (!userId || !referralCode || !userPhone) {
      throw new Error("Missing required parameters: userId, referralCode, or userPhone");
    }

    // Find the referral code owner
    const { data: referralCodeData, error: codeError } = await supabaseClient
      .from("user_referral_codes")
      .select("user_id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (codeError || !referralCodeData) {
      console.error("Invalid referral code:", referralCode);
      throw new Error("Invalid referral code");
    }

    const inviterId = referralCodeData.user_id;
    console.log(`Found inviter: ${inviterId}`);

    // Check if there's an existing pending referral and validate expiration
    const { data: existingReferral, error: referralError } = await supabaseClient
      .from("referrals")
      .select("*")
      .eq("inviter_id", inviterId)
      .eq("invitee_phone", userPhone)
      .eq("status", "pending")
      .maybeSingle();

    if (referralError) {
      console.error("Error checking existing referral:", referralError);
    }

    let referralId: string;

    if (existingReferral) {
      // Check if the referral has expired
      const now = new Date();
      const expiresAt = new Date(existingReferral.expires_at);
      
      if (now > expiresAt) {
        console.log('Referral has expired, updating status');
        
        // Update expired referral status
        await supabaseClient
          .from('referrals')
          .update({ status: 'expired' })
          .eq('id', existingReferral.id);
        
        throw new Error('Referral invitation has expired');
      }

      // Update existing referral
      console.log("Updating existing referral:", existingReferral.id);
      
      const { data: updatedReferral, error: updateError } = await supabaseClient
        .from("referrals")
        .update({
          status: "joined",
          joined_at: new Date().toISOString(),
          invitee_name: userName
        })
        .eq("id", existingReferral.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating referral:", updateError);
        throw updateError;
      }

      referralId = updatedReferral.id;
    } else {
      // Create new referral record
      console.log("Creating new referral record");
      
      // Get inviter's current tier to apply bonus multiplier
      const { data: tierData } = await supabaseClient.rpc('get_user_referral_tier', {
        p_user_id: inviterId
      });
      
      const currentTier = tierData && tierData.length > 0 ? tierData[0] : null;
      const baseRewardDays = 7;
      const bonusMultiplier = currentTier?.bonus_multiplier || 1;
      const finalRewardDays = Math.floor(baseRewardDays * bonusMultiplier);

      console.log(`Applying tier bonus: ${currentTier?.tier_name || 'المبتدئ'} with multiplier ${bonusMultiplier}x = ${finalRewardDays} days`);

      const { data: newReferral, error: insertError } = await supabaseClient
        .from("referrals")
        .insert({
          inviter_id: inviterId,
          invitee_phone: userPhone,
          invitee_name: userName,
          referral_code: referralCode,
          status: "joined",
          joined_at: new Date().toISOString(),
          reward_days: finalRewardDays,
          original_reward_days: baseRewardDays,
          tier_at_time: currentTier?.tier_name || "المبتدئ",
          bonus_applied: bonusMultiplier > 1,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating referral:", insertError);
        throw insertError;
      }

      referralId = newReferral.id;
    }

    // Get the final reward days from the referral record (with bonus applied)
    const { data: referralRecord } = await supabaseClient
      .from("referrals")
      .select("reward_days")
      .eq("id", referralId)
      .single();

    const rewardDays = referralRecord?.reward_days || 7;

    // Create referral reward for the inviter
    console.log(`Creating referral reward for inviter: ${rewardDays} days`);
    
    const { error: rewardError } = await supabaseClient
      .from("referral_rewards")
      .insert({
        user_id: inviterId,
        referral_id: referralId,
        days_earned: rewardDays,
        applied_to_subscription: false
      });

    if (rewardError) {
      console.error("Error creating referral reward:", rewardError);
      // Don't throw here as the main signup should still succeed
    }

    // Create a free trial subscription for the new user (7 days)
    console.log("Creating trial subscription for new user");
    
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    const { error: subscriptionError } = await supabaseClient
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan: "personal",
        status: "trialing",
        started_at: trialStartDate.toISOString(),
        expires_at: trialEndDate.toISOString()
      });

    if (subscriptionError) {
      console.error("Error creating trial subscription:", subscriptionError);
      // Don't throw here as the referral processing is more important
    }

    // Send notification to the inviter (optional)
    const { error: notificationError } = await supabaseClient
      .from("notifications")
      .insert({
        user_id: inviterId,
        type: "referral_completed",
        payload: {
          invitee_name: userName,
          reward_days: 7,
          referral_code: referralCode
        }
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    console.log("✅ Referral signup processed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم معالجة الإحالة بنجاح",
        referralId,
        trialDays: 7
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Error in process-referral-signup function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process referral signup",
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);