import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartInviteRequest {
  groupId: string;
  phoneNumber: string;
  groupName: string;
  senderName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { groupId, phoneNumber, groupName, senderName }: SmartInviteRequest = await req.json();

    if (!groupId || !phoneNumber || !groupName) {
      throw new Error('Missing required parameters');
    }

    console.log('Processing smart invite:', { groupId, phoneNumber, groupName, senderName });

    // Clean phone number (remove all non-digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check if phone number is linked to an existing user account
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id, display_name, name')
      .eq('phone', cleanPhone)
      .maybeSingle();

    console.log('Found existing profile:', existingProfile);

    if (existingProfile) {
      // User has an account - check if they're already in the group
      const { data: existingMember } = await supabaseClient
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existingMember) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'المستخدم عضو في المجموعة بالفعل',
            type: 'already_member'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Send internal notification to existing user
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: existingProfile.id,
          type: 'group_invite',
          payload: {
            group_id: groupId,
            group_name: groupName,
            inviter_name: senderName,
            inviter_id: user.id,
            message: `تمت دعوتك للانضمام لمجموعة "${groupName}" من قبل ${senderName}`
          }
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // Create invite record with token for tracking
      const { data: inviteData, error: inviteError } = await supabaseClient
        .from('invites')
        .insert({
          group_id: groupId,
          phone_or_email: cleanPhone,
          created_by: user.id,
          invited_role: 'member',
          status: 'sent',
          invite_type: 'notification',
          invite_source: 'smart_invite'
        })
        .select('invite_token')
        .single();

      if (inviteError) {
        console.error('Error creating invite record:', inviteError);
      }

      console.log('Sent internal notification to existing user');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `تم إرسال إشعار داخلي للمستخدم ${existingProfile.display_name || existingProfile.name || 'المسجل'}`,
          type: 'internal_notification',
          userExists: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // No existing account - send SMS invitation with app download link
      try {
        // Create invite record with token first
        const { data: inviteData, error: inviteError } = await supabaseClient
          .from('invites')
          .insert({
            group_id: groupId,
            phone_or_email: cleanPhone,
            created_by: user.id,
            invited_role: 'member',
            status: 'sent',
            invite_type: 'phone',
            invite_source: 'whatsapp'
          })
          .select('invite_token')
          .single();

        if (inviteError || !inviteData) {
          throw new Error('Failed to create invite record');
        }

        // Generate proper invite link with token
        const inviteLink = `${req.headers.get('origin') || Deno.env.get('SITE_URL') || 'https://diviso.app'}/invite-phone/${inviteData.invite_token}`;

        const { error: smsError } = await supabaseClient.functions.invoke('send-sms-invite', {
          body: {
            phone: phoneNumber.startsWith('+') ? phoneNumber : `+966${cleanPhone}`,
            groupName,
            inviteLink,
            senderName
          }
        });

        if (smsError) {
          console.error('SMS error:', smsError);
          // Don't fail the whole operation for SMS errors
        }

        console.log('Sent SMS invite to new user');

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `تم إرسال دعوة SMS إلى ${phoneNumber} مع رابط تحميل التطبيق`,
            type: 'sms_sent',
            userExists: false
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'تعذر إرسال SMS، حاول مرة أخرى',
            type: 'sms_failed'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
  } catch (error) {
    console.error('Smart invite error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'حدث خطأ غير متوقع',
        type: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});