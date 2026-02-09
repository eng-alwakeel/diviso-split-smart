import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralSignupRequest {
  userId: string;
  referralCode: string;
  userPhone?: string;
  userName?: string;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Process Referral Signup ===");
    
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

    if (!userId || !referralCode) {
      throw new Error("Missing required parameters: userId or referralCode");
    }
    
    // Generate a placeholder phone if not provided (for email signups)
    const effectivePhone = userPhone || `email_${userId.substring(0, 8)}`;

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
    console.log('Inviter found for referral code');

    // Trial days for the new user (invitee only)
    const trialDays = 7;

    // Check for existing pending referral (personal or group invite)
    const { data: existingReferral, error: referralError } = await supabaseClient
      .from("referrals")
      .select("*, group_id, group_name")
      .eq("inviter_id", inviterId)
      .eq("invitee_phone", effectivePhone)
      .eq("status", "pending")
      .maybeSingle();

    if (referralError) {
      console.error("Error checking existing referral:", referralError);
    }

    // Also check group invites table for pending invitations
    const { data: pendingGroupInvite, error: inviteError } = await supabaseClient
      .from("invites")
      .select("*, referral_id, group_id")
      .eq("phone_or_email", effectivePhone)
      .eq("status", "pending")
      .maybeSingle();

    if (inviteError) {
      console.error("Error checking group invites:", inviteError);
    }

    let referralId: string;
    let isGroupReferral = false;
    let groupId: string | null = null;

    if (existingReferral) {
      // Check if the referral has expired
      const now = new Date();
      const expiresAt = new Date(existingReferral.expires_at);
      
      if (now > expiresAt) {
        console.log('Referral has expired, updating status');
        
        await supabaseClient
          .from('referrals')
          .update({ status: 'expired' })
          .eq('id', existingReferral.id);
        
        throw new Error('Referral invitation has expired');
      }

      // Update existing referral
      console.log("Updating existing referral");
      isGroupReferral = !!existingReferral.group_id;
      groupId = existingReferral.group_id;
      
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

      // If this was linked to a group invite, update that too
      if (pendingGroupInvite && pendingGroupInvite.referral_id === existingReferral.id) {
        await supabaseClient
          .from("invites")
          .update({
            status: "accepted",
            accepted_by: userId,
            accepted_at: new Date().toISOString()
          })
          .eq("id", pendingGroupInvite.id);
        
        console.log('Updated linked group invite');
      }
    } else if (pendingGroupInvite && pendingGroupInvite.referral_id) {
      // There's a group invite with a linked referral - update it
      console.log("Found group invite with linked referral");
      
      const { data: linkedReferral, error: linkedError } = await supabaseClient
        .from("referrals")
        .update({
          status: "joined",
          joined_at: new Date().toISOString(),
          invitee_name: userName
        })
        .eq("id", pendingGroupInvite.referral_id)
        .select()
        .single();

      if (linkedError) {
        console.error("Error updating linked referral:", linkedError);
      } else {
        referralId = linkedReferral.id;
        isGroupReferral = true;
        groupId = pendingGroupInvite.group_id;
      }

      // Update group invite status
      await supabaseClient
        .from("invites")
        .update({
          status: "accepted",
          accepted_by: userId,
          accepted_at: new Date().toISOString()
        })
        .eq("id", pendingGroupInvite.id);

    } else {
      // Create new referral record - simplified without tier system
      console.log("Creating new referral record with fixed 7-day reward");

      const { data: newReferral, error: insertError } = await supabaseClient
        .from("referrals")
        .insert({
          inviter_id: inviterId,
          invitee_phone: effectivePhone,
          invitee_name: userName || "مستخدم جديد",
          referral_code: referralCode,
          status: "joined",
          joined_at: new Date().toISOString(),
          referral_source: "direct",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating referral:", insertError);
        throw insertError;
      }

      referralId = newReferral.id;
    }

    // Get referral record for group info
    const { data: referralRecord } = await supabaseClient
      .from("referrals")
      .select("group_id, group_name")
      .eq("id", referralId)
      .single();

    // =============================================
    // Create referral_progress record with invitee_id
    // Points: 0 on signup, 10 on first usage, 20 on group/settlement
    // =============================================
    console.log("Creating referral_progress record for quality-based points system");
    
    const { error: progressError } = await supabaseClient
      .from("referral_progress")
      .insert({
        referral_id: referralId,
        inviter_id: inviterId,
        invitee_id: userId, // Critical: this enables milestone tracking
        signup_completed: true,
        points_for_signup: 0,
        total_points: 0
      });

    if (progressError) {
      console.error("Error creating referral_progress:", progressError);
      // Non-critical, continue
    } else {
      console.log("✅ Created referral_progress - invitee can now trigger milestone points");
    }

    // Create a free trial subscription for the new user (7 days)
    console.log("Creating trial subscription for new user");
    
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + (trialDays * 24 * 60 * 60 * 1000));

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
    }

    // Send notification to the inviter
    const notificationPayload: Record<string, unknown> = {
      invitee_name: userName || "صديق جديد",
      referral_code: referralCode,
      source: isGroupReferral ? "group_invite" : "personal",
      points_pending: true,
      message_ar: `${userName || 'صديق جديد'} سجّل! ستحصل على 10 نقاط عند أول استخدام + 20 نقاط عند إنشاء قروب/تسوية`
    };

    if (referralRecord?.group_name) {
      notificationPayload.group_name = referralRecord.group_name;
    }

    const { error: notificationError } = await supabaseClient
      .from("notifications")
      .insert({
        user_id: inviterId,
        type: "referral_joined",
        payload: notificationPayload
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    console.log(`Referral signup processed (source: ${isGroupReferral ? 'group' : 'personal'})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم معالجة الإحالة بنجاح - ستحصل على 30 نقطة: 10 عند أول استخدام + 20 عند إنشاء قروب/تسوية",
        referralId,
        trialDays: 7,
        isGroupReferral,
        groupId,
        pointsSystem: {
          firstUsage: 10,
          groupOrSettlement: 20,
          total: 30
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in process-referral-signup:", error?.message || 'Unknown error');
    
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
